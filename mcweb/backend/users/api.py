import logging
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.models import auth, User, Group
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.contrib.auth.decorators import login_required
from .models import ResetCodes
from .serializer import ResetRequestSerializer, GiveAPIAccessSerializer
from django.conf import settings

logger = logging.getLogger(__name__)

INVALID_USER_MESSAGE = "User or credentials invalid"  # best to be generic about if user, password, or token is problem

class RequestReset(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data['email']
        email = email.strip()
        user = User.objects.filter(email__iexact=email).first()

        # check to see in data if reset for password or api_token
        reset_type = data['reset_type']
        if reset_type == 'email-confirm':
            reset_text = 'verify-user'
        elif reset_type == 'password':
            reset_text = 'reset-password/confirmed'
        else:
            return Response({"error": "Invalid reset_type"}, status=status.HTTP_400_BAD_REQUEST)

        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user) 
            reset = ResetCodes(email=email, token=token)
            reset.save()
            domain = request.get_host()
            reset_url = f"http://{domain}/{reset_text}?token={token}"

            if reset_type == 'email-confirm':
                subject = 'Welcome to Media Cloud please verify your email'
                message = f"Hello, thank you for signing up. Please use this link to verify your email and complete your registration: {reset_url} \n\n Thank you!"
            elif reset_type == 'password':
                subject = 'Reset Password'
                message = f"Hello, please use this link to reset your password: {reset_url} \n\n Thank you!"
            
            if settings.EMAIL_HOST:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email]
                )
            else:
                logger.info("RequestReset: EMAIL_HOST not set, skipping email to %s", email)

            return Response({'success': 'We have sent you a link to reset your password'}, status=status.HTTP_200_OK)
        else:
            return Response({"error": INVALID_USER_MESSAGE}, status=status.HTTP_401_UNAUTHORIZED)


class ConfirmedEmail(generics.GenericAPIView):
    serializer_class = GiveAPIAccessSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        reset_obj = ResetCodes.objects.filter(token=data['token']).first()
        
        if not reset_obj:
            return Response({'error': INVALID_USER_MESSAGE}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = User.objects.filter(email__iexact=reset_obj.email).first()

        if user:
            user.groups.add(Group.objects.get(name=settings.GROUPS.API_ACCESS))
            user.profile.verified_email = True
            user.profile.save()
            user.save()
            reset_obj.delete()
            return Response({'success':'User verified and API Access Granted'})
        else:
            return Response({"error": INVALID_USER_MESSAGE}, status=status.HTTP_401_UNAUTHORIZED)

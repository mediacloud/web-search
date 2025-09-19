from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.models import auth, User, Group
from django.contrib.auth.password_validation import validate_password
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
import settings
from django.contrib.auth.decorators import login_required
from .models import ResetCodes, create_auth_token
from .serializer import ResetRequestSerializer, ResetPasswordSerializer, GiveAPIAccessSerializer
from .groups import API_ACCESS

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
        if reset_type == 'api_token':
            reset_text = 'verify-user'
        elif reset_type == 'password':
            reset_text = 'reset-password/confirmed'

        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user) 
            reset = ResetCodes(email=email, token=token)
            reset.save()
            domain = request.get_host()
            reset_url = f"http://{domain}/{reset_text}?token={token}"

            if reset_type == 'api_token':
                subject = 'Get API Access'
                message = f"Hello, please use this link to get API Access: {reset_url} \n\n Thank you!"

            elif reset_type == 'password':
                subject = 'Reset Password'
                message = f"Hello, please use this link to reset your password: {reset_url} \n\n Thank you!"

            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email]
            )

            return Response({'success': 'We have sent you a link to reset your password'}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "User with credentials not found"}, status=status.HTTP_404_NOT_FOUND)


class ResetPassword(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        new_password = data['new_password']
        new_password = new_password.strip()
        confirm_password = data['confirm_password']
        confirm_password = confirm_password.strip()
        
        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)
        
        reset_obj = ResetCodes.objects.filter(token=data['token']).first()
        
        if not reset_obj:
            return Response({'error':'Invalid token'}, status=400)
        
        user = User.objects.filter(email=reset_obj.email).first()
        
        if user:
            user.set_password(request.data['new_password'])
            user.save()
            reset_obj.delete()
            return Response({'success':'Password updated'})
        else: 
            return Response({'error':'No user found'}, status=404)
        

class GiveAPIAccess(generics.GenericAPIView):
    serializer_class = GiveAPIAccessSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        reset_obj = ResetCodes.objects.filter(token=data['token']).first()
        
        if not reset_obj:
            return Response({'error':'Invalid token'}, status=400)
        
        user = User.objects.filter(email=reset_obj.email).first()

        if user:
            user.groups.add(Group.objects.get(name=API_ACCESS))
            user.save()
            reset_obj.delete()
            return Response({'success':'API Access Granted'})
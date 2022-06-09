from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass





# class User(AbstractBaseUser):
#     first_name = models.CharField(max_length=30)
#     last_name = models.CharField(max_length=50)
#     username = models.CharField(max_length=100, unique=True)
#     email = models.EmailField(verbose_name='email_address',
#                               max_length=255,
#                               unique=True)
#     date_of_birth = models.DateField()

#     is_active = models.BooleanField(default=True)
#     is_admin = models.BooleanField(default=False)

#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.email

#     def has_perm(self, perm, obj=None):
#         "Does the user have a specific permission?"
#         # Simplest possible answer: Yes, always
#         return True

#     def has_module_perms(self, app_label):
#         "Does the user have permissions to view the app `app_label`?"
#         # Simplest possible answer: Yes, always
#         return False

#     @property
#     def is_staff(self):
#         "Is the user a member of staff?"
#         # Simplest possible answer: All admins are staff
#         return self.is_admin


# class MyUserManager(BaseUserManager):
#     def create_user(self, email, date_of_birth, password=None):
#         """
#         Creates and saves a user with the given email, date of birth, and password 
#         """

#         if not email:
#             raise ValueError('Users must have an email address')

#         user = self.model(
#             email=self.normalize_email(email),
#             date_of_birth=date_of_birth,
#         )


#         user.set_password(password)
#         user.save(using=self._db)
#         user.is_admin = False
#         return user

#     def create_superuser(self, email, date_of_birth, password=None):
#         """
#         Creates and saves a superuser with the given email, date of
#         birth and password.
#         """

#         user = self.create_user(
#             email,
#             password=password,
#             date_of_birth=date_of_birth,
#         )

#         user.is_admin = True
#         user.save(using=self._db)
#         return user

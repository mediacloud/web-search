# Generated by Django 4.1.3 on 2022-11-29 16:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_profile_imported_password_hash'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='registered',
            field=models.BooleanField(default=False),
        ),
    ]

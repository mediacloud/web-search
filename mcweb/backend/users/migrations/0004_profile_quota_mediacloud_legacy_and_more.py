# Generated by Django 4.1.3 on 2022-11-29 22:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_profile_imported_password_hash'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='quota_mediacloud_legacy',
            field=models.IntegerField(default=100000),
        ),
        migrations.AddField(
            model_name='profile',
            name='quota_reddit_pushshift',
            field=models.IntegerField(default=10000),
        ),
        migrations.AddField(
            model_name='profile',
            name='quota_twitter',
            field=models.IntegerField(default=10000),
        ),
        migrations.AddField(
            model_name='profile',
            name='quota_wayback_machine',
            field=models.IntegerField(default=100000),
        ),
        migrations.AddField(
            model_name='profile',
            name='quota_youtube',
            field=models.IntegerField(default=10000),
        ),
    ]

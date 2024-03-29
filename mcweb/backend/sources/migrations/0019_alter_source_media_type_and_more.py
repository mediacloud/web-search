# Generated by Django 4.1.3 on 2022-12-08 18:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sources', '0018_alter_collection_platform_alter_source_media_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='source',
            name='media_type',
            field=models.CharField(blank=True, choices=[('audio_broadcast', 'Audio Broadcast'), ('digital_native', 'Digital Native'), ('print_native', 'Print Native'), ('video_broadcast', 'Video Broadcast'), ('other', 'Other')], max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='source',
            name='url_search_string',
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
    ]

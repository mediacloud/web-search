# Generated by Django 4.1.6 on 2024-10-02 19:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sources', '0023_source_alerted'),
    ]

    operations = [
        migrations.AddField(
            model_name='collection',
            name='static',
            field=models.BooleanField(blank=True, default=False),
        ),
    ]

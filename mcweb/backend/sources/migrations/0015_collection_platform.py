# Generated by Django 4.0.7 on 2022-11-09 18:50

import backend.sources.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sources', '0014_source_first_story'),
    ]

    operations = [
        migrations.AddField(
            model_name='collection',
            name='platform',
            field=models.CharField(choices=[(backend.sources.models.Collection.CollectionPlatforms['ONLINE_NEWS'], 'online_news'), (backend.sources.models.Collection.CollectionPlatforms['REDDIT'], 'digital_native'), (backend.sources.models.Collection.CollectionPlatforms['YOUTUBE'], 'youtube')], default='online_news', max_length=100, null=True),
        ),
    ]

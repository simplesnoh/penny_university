# Generated by Django 2.2.13 on 2020-11-18 01:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pennychat', '0004_pennychat_video_conference_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='pennychat',
            name='google_event_id',
            field=models.TextField(null=True),
        ),
    ]

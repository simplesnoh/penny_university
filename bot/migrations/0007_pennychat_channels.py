# Generated by Django 2.2.5 on 2019-09-29 16:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0006_auto_20190911_0108'),
    ]

    operations = [
        migrations.AddField(
            model_name='pennychat',
            name='channels',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
    ]

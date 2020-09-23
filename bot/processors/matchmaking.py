from datetime import timedelta

from django.utils import timezone

from bot.processors.base import BotModule
from bot.processors.filters import is_block_interaction_event, has_action_id
from bot.utils import chat_postEphemeral_with_fallback
from matchmaking.models import TopicChannel, MatchRequest
from users.models import SocialProfile

REQUEST_MATCHES = 'request_matches'


def request_match_blocks(channel_id):
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"Hey folks! <#{channel_id}> has been set up as a topic channel. Every couple of weeks, "
                        f"I (the Penny Bot) will set you up with other users to chat about <#{channel_id}>.",
            }
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "If you're interested in having a virtual chat with another member of this channel next week, "
                        "click the button below!",
                "emoji": True,
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": REQUEST_MATCHES,
                    "text": {
                        "type": "plain_text",
                        "text": "I'm in! :handshake:",
                        "emoji": True,
                    },
                    "style": "primary",
                }
            ]
        }
    ]

    return blocks


def confirm_match_request(channel_id):
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"Awesome, we will match you with other users in <#{channel_id}> soon!",
            }
        }
    ]

    return blocks


class MatchMakingBotModule(BotModule):
    processors = [
        'request_matches',
    ]

    def __init__(self, slack):
        self.slack_client = slack

    @classmethod
    def set_topic_channel(cls, slack, event):
        channel, created = TopicChannel.objects.get_or_create(
            channel_id=event['channel_id'],
            defaults={
                'slack_team_id': event['team_id'],
                'name': event['channel_name']
            }
        )

        if created:
            text = 'This channel is now a Penny Chat topic channel. We will invite users to connect every few weeks.'
        else:
            text = 'This channel is already a topic channel.'

        chat_postEphemeral_with_fallback(
            slack,
            channel=event['channel_id'],
            user=event['user_id'],
            text=text,
        )

    @is_block_interaction_event
    @has_action_id(REQUEST_MATCHES)
    def request_matches(self, event):
        channel_id = event['channel']['id']
        team_id = event['team']['id']
        user_id = event['user']['id']

        profile = SocialProfile.objects.get(slack_id=user_id)
        topic_channel = TopicChannel.objects.get(channel_id=channel_id, slack_team_id=team_id)

        recent_requests = MatchRequest.objects.filter(
            topic_channel=topic_channel,
            date__gte=timezone.now() - timedelta(days=1),
        )

        if len(recent_requests) > 0:
            chat_postEphemeral_with_fallback(
                self.slack_client,
                channel=channel_id,
                user=user_id,
                text='You already requested to be matched in this channel recently.',
            )
        else:
            MatchRequest.objects.create(profile=profile, topic_channel=topic_channel)

            chat_postEphemeral_with_fallback(
                self.slack_client,
                channel=channel_id,
                user=user_id,
                blocks=confirm_match_request(channel_id),
            )
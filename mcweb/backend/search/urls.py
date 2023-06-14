from django.urls import path
from . import views

urlpatterns = [
    path('total-count', views.total_count),
    path('sample', views.sample),
    path('words', views.words),
    path('download-top-words-csv', views.download_words_csv),
    path('count-over-time', views.count_over_time),
    path('download-counts-over-time-csv', views.download_counts_over_time_csv),
    path('download-all-content-csv', views.download_all_content_csv),
    path('story', views.story_detail),
    path('languages', views.languages),
    path('download-top-languages-csv', views.download_languages_csv),
    path('send-email-large-download-csv', views.send_email_large_download_csv)
]

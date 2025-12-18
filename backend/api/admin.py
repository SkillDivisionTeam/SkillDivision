from django.contrib import admin
from .models import Profile, Event, Question, QuizResult


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_code", "date", "is_active")
    search_fields = ("title", "event_code")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "event", "topic", "difficulty")
    list_filter = ("event", "difficulty")


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "score", "completed_at")
    list_filter = ("event",)


admin.site.register(Profile)

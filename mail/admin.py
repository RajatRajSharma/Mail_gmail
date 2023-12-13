from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Email

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('id', 'username', 'email', 'first_name', 'last_name')

@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'sender', 'subject', 'timestamp', 'read', 'archived')
    list_filter = ('read', 'archived')
    search_fields = ('user__email', 'sender__email', 'recipients__email', 'subject', 'body')

    def recipients_list(self, obj):
        return ", ".join([recipient.email for recipient in obj.recipients.all()])
    recipients_list.short_description = 'Recipients'

admin.site.site_header = 'Mail Administration'

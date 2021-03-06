from django.http import JsonResponse
from gam.models.player.player import Player

def getinfo_acapp(request):
    player = Player.objects.all()[0]
    return JsonResponse({
        "result": "success",
        "username": player.user.username,
        "photo": player.photo,
    })

def getinfo_web(request):
    player = Player.objects.all()[0]
    return JsonResponse({
        "result": "success",
        "username": player.user.username,
        "photo": player.photo,
    })

def getinfo(request):
    platform = request.GET.get('platform')
    if platform == "ACAPP":
        return getinfo_acapp(request)
    elif platform == "WEB":
        return getinfo_web

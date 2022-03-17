from django.http import HttpResponse

def index(request):
    line1 = '<img src="https://www.xiazaiba.com/uploadfiles/editor/2015/0701/2015070113273983356.png">'
    return HttpResponse(line1)

def play(request):
    line1 = '<h2 style="margin-top: 10px;">2. tmux和vim</h2>'
    return HttpResponse(line1)

# Create your views here.

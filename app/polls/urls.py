from django.urls import path

import polls.views as views

urlpatterns = [
    path('', views.index, name='index'),
    #input files
    path('registersuper/', views.registerSuper),
    path('register/', views.register),
    path('login/', views.login),
    path('create/', views.create),
    path('confirm/', views.confirm),
    path('transfer/', views.transfer),
    path('financing/', views.financing),
    path('settle/', views.settle),
    path('find/', views.find),
    path('balance/', views.balance),
]


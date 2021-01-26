# Generated by Django 3.1.2 on 2020-11-07 08:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Article',
            fields=[
                ('article_id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(blank=True, max_length=45, null=True)),
                ('length', models.IntegerField(blank=True, null=True)),
                ('author', models.CharField(blank=True, max_length=45, null=True)),
                ('time', models.TimeField(blank=True, null=True)),
                ('comment', models.CharField(blank=True, max_length=45, null=True)),
                ('forward', models.CharField(blank=True, max_length=45, null=True)),
                ('url', models.CharField(blank=True, db_column='URL', max_length=45, null=True)),
                ('emotion', models.CharField(max_length=45)),
                ('emotion_strength', models.CharField(max_length=45)),
            ],
            options={
                'db_table': 'article',
            },
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('event_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=45)),
                ('introduction', models.CharField(max_length=45)),
            ],
            options={
                'db_table': 'event',
            },
        ),
        migrations.CreateModel(
            name='Media',
            fields=[
                ('media_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=45)),
                ('country', models.CharField(blank=True, max_length=45, null=True)),
                ('nickname', models.CharField(blank=True, max_length=45, null=True)),
                ('introduction', models.CharField(blank=True, max_length=45, null=True)),
            ],
            options={
                'db_table': 'media',
            },
        ),
        migrations.CreateModel(
            name='Target',
            fields=[
                ('target_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(blank=True, max_length=45, null=True)),
                ('introduction', models.CharField(blank=True, max_length=45, null=True)),
            ],
            options={
                'db_table': 'target',
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(blank=True, max_length=255, null=True)),
                ('password', models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={
                'db_table': 'user',
            },
        ),
        migrations.CreateModel(
            name='Wordcloud',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('word', models.CharField(max_length=45)),
                ('proportion', models.FloatField()),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
            ],
            options={
                'db_table': 'wordcloud',
            },
        ),
        migrations.CreateModel(
            name='Targetkgraph',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('point1', models.CharField(blank=True, max_length=45, null=True)),
                ('point2', models.CharField(blank=True, max_length=45, null=True)),
                ('relation', models.CharField(blank=True, max_length=45, null=True)),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.target')),
            ],
            options={
                'db_table': 'targetkgraph',
            },
        ),
        migrations.CreateModel(
            name='Spreadingprocess',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('point1', models.CharField(blank=True, max_length=45, null=True)),
                ('point2', models.CharField(blank=True, max_length=45, null=True)),
                ('relation', models.CharField(blank=True, max_length=45, null=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.event')),
            ],
            options={
                'db_table': 'spreadingprocess',
            },
        ),
        migrations.CreateModel(
            name='Sentence',
            fields=[
                ('sentence_id', models.AutoField(primary_key=True, serialize=False)),
                ('sentence_num', models.IntegerField()),
                ('text', models.CharField(max_length=10000)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
            ],
            options={
                'db_table': 'sentence',
            },
        ),
        migrations.CreateModel(
            name='Partofspeechtagging',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('word', models.CharField(blank=True, max_length=45, null=True)),
                ('value', models.IntegerField(blank=True, null=True)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
            ],
            options={
                'db_table': 'partofspeechtagging',
            },
        ),
        migrations.CreateModel(
            name='Metaphoranalysis',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('noumenon', models.CharField(max_length=45)),
                ('vehicle', models.CharField(max_length=45)),
                ('n_emotion', models.CharField(max_length=45)),
                ('v_emotion', models.CharField(max_length=45)),
                ('appearinnoumenon', models.IntegerField(db_column='appearInNoumenon')),
                ('relatedtonoumenon', models.IntegerField(db_column='relatedToNoumenon')),
                ('sentence', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.sentence')),
            ],
            options={
                'db_table': 'metaphoranalysis',
            },
        ),
        migrations.CreateModel(
            name='Gjanalysis',
            fields=[
                ('gj_id', models.AutoField(db_column='GJ_id', primary_key=True, serialize=False)),
                ('gj_type', models.CharField(blank=True, db_column='GJ_type', max_length=45, null=True)),
                ('gj_style', models.CharField(blank=True, db_column='GJ_style', max_length=45, null=True)),
                ('confidence', models.CharField(blank=True, db_column='Confidence', max_length=45, null=True)),
                ('gjanalysiscol', models.CharField(blank=True, db_column='GJanalysiscol', max_length=45, null=True)),
                ('sentence', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.sentence')),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.target')),
            ],
            options={
                'db_table': 'gjanalysis',
            },
        ),
        migrations.CreateModel(
            name='EventTarget',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.event')),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.target')),
            ],
            options={
                'db_table': 'event-target',
            },
        ),
        migrations.CreateModel(
            name='Eventsourcing',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('time', models.DateTimeField(blank=True, null=True)),
                ('description', models.CharField(blank=True, max_length=45, null=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.event')),
            ],
            options={
                'db_table': 'eventsourcing',
            },
        ),
        migrations.CreateModel(
            name='Eventrelationgraph',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('point1', models.CharField(blank=True, max_length=45, null=True)),
                ('point2', models.CharField(blank=True, max_length=45, null=True)),
                ('relation', models.CharField(blank=True, max_length=45, null=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.event')),
            ],
            options={
                'db_table': 'eventrelationgraph',
            },
        ),
        migrations.CreateModel(
            name='Eventkgraph',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('point1', models.CharField(max_length=45)),
                ('point2', models.CharField(max_length=45)),
                ('ralation', models.CharField(max_length=45)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.event')),
            ],
            options={
                'db_table': 'eventkgraph',
            },
        ),
        migrations.CreateModel(
            name='Entityextraction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity', models.CharField(max_length=45)),
                ('emotion', models.IntegerField()),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
            ],
            options={
                'db_table': 'entityextraction',
            },
        ),
        migrations.CreateModel(
            name='Emotionaldistribution',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('emotion', models.CharField(blank=True, max_length=45, null=True)),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.target')),
            ],
            options={
                'db_table': 'emotionaldistribution',
            },
        ),
        migrations.CreateModel(
            name='Emotionalanalysis',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('emotion1', models.CharField(blank=True, max_length=45, null=True)),
                ('emotion2', models.CharField(blank=True, max_length=45, null=True)),
                ('emotion3', models.CharField(blank=True, max_length=45, null=True)),
                ('rate1', models.FloatField(blank=True, null=True)),
                ('rate2', models.FloatField(blank=True, null=True)),
                ('rate3', models.FloatField(blank=True, null=True)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
            ],
            options={
                'db_table': 'emotionalanalysis',
            },
        ),
        migrations.CreateModel(
            name='ArticleTarget',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.target')),
            ],
            options={
                'db_table': 'article-target',
            },
        ),
        migrations.CreateModel(
            name='Articlekgraph',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('point1', models.CharField(max_length=45)),
                ('point2', models.CharField(max_length=45)),
                ('relation', models.CharField(max_length=45)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.article')),
            ],
            options={
                'db_table': 'articlekgraph',
            },
        ),
        migrations.AddField(
            model_name='article',
            name='source',
            field=models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='polls.media'),
        ),
    ]

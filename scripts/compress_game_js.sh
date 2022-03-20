#！ /bin/bash

PROJECT_PATH=/home/hmd/acapp
JS_PATH=/home/hmd/acapp/game/static/js/
JS_PATH_DIST=${JS_PATH}dist/
JS_PATH_SRC=${JS_PATH}src/

find $JS_PATH_SRC -type f -name *.js | sort | xargs cat > ${JS_PATH_DIST}game.js
cd $PROJECT_PATH && echo yes | python3 manage.py collectstatic

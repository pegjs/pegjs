@echo off

set DIR_WITH_SLASH=%~dp0
set DIR=%DIR_WITH_SLASH:~0,-1%

java -jar "%DIR%\..\vendor\rhino\js.jar" "%DIR%\pegjs-main.js" "%DIR%" %*

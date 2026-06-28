@echo off
cd /d "c:\Users\vsrez\OneDrive\Documents\Projects\Makedonska Berza\talir"
echo Starting daily update at %date% %time% >> update.log
call npm run script:update >> update.log 2>&1
echo Finished daily update at %date% %time% >> update.log

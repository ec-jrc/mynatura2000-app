# Use the correct CSS file for Android devices
rm www/css/ionic.app.css
cp www/css/ionic.app.android.css www/css/ionic.app.css

# Build current release
cordova build android --debug 

cp platforms/android/build/outputs/apk/android-debug.apk /mnt/share/mynatura2000.apk


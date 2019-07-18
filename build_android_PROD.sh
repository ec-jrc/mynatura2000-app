# Use the correct CSS file for Android devices
rm www/css/ionic.app.css
cp www/css/ionic.app.android.css www/css/ionic.app.css

# Build current release
cordova build android --release 

cp platforms/android/build/outputs/apk/android-release-unsigned.apk /mnt/share/mynatura2000_prod.apk

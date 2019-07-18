# Use the correct CSS file for iOS devices
rm www/css/ionic.app.css
cp www/css/ionic.app.ios.css www/css/ionic.app.css

# Build current release
cordova build ios

# Use the correct Info.plist file for DEV
mv platforms/ios/MyNatura2000/MyNatura2000-Info.plist platforms/ios/MyNatura2000/BUILD_MyNatura2000-Info.plist
cp platforms/ios/MyNatura2000/DEV_MyNatura2000-Info.plist platforms/ios/MyNatura2000/MyNatura2000-Info.plist

"""
Native Android WebView APK Generator for Family Savings Account App
Bundles local offline HTML, CSS, JS, and libraries into a standalone APK.
"""
import os
import shutil
import subprocess
import sys

BASE_DIR = r"d:\Moniii\mobile"
PROJECT_DIR = os.path.join(BASE_DIR, "android-project")
STUDY_BOARD_BASE = r"c:\Users\Monisha\Downloads\study-board-pwa\study-board-pwa"
JAVA_HOME = os.path.join(STUDY_BOARD_BASE, "jdk", "jdk-21.0.12+8")
ANDROID_SDK = os.path.join(STUDY_BOARD_BASE, "android-sdk")

APP_NAME = "Family Savings Account"
PACKAGE_ID = "com.familysavings.app"
VERSION = "1.0.0"

env = os.environ.copy()
env["JAVA_HOME"] = JAVA_HOME
env["ANDROID_HOME"] = ANDROID_SDK
env["ANDROID_SDK_ROOT"] = ANDROID_SDK
env["PATH"] = os.path.join(JAVA_HOME, "bin") + ";" + env.get("PATH", "")

def run(cmd, cwd=None, check=True):
    print(f">>> {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    r = subprocess.run(cmd, cwd=cwd or PROJECT_DIR, env=env, shell=isinstance(cmd, str), capture_output=False, text=True)
    if check and r.returncode != 0:
        print(f"Command failed with exit code {r.returncode}")
        sys.exit(1)
    return r

print("=== Family Savings Account APK Builder ===\n")

# 1. Clean Project Dir
if os.path.exists(PROJECT_DIR):
    shutil.rmtree(PROJECT_DIR)
os.makedirs(PROJECT_DIR, exist_ok=True)

# 2. Create Directory Tree
dirs = [
    "app/src/main/java/com/familysavings/app",
    "app/src/main/assets",
    "app/src/main/assets/lib",
    "app/src/main/res/drawable",
    "app/src/main/res/mipmap-hdpi",
    "app/src/main/res/mipmap-mdpi",
    "app/src/main/res/mipmap-xhdpi",
    "app/src/main/res/mipmap-xxhdpi",
    "app/src/main/res/mipmap-xxxhdpi",
    "app/src/main/res/values",
    "gradle/wrapper",
]
for d in dirs:
    os.makedirs(os.path.join(PROJECT_DIR, d), exist_ok=True)

# 3. Copy Web Assets
assets_dst = os.path.join(PROJECT_DIR, "app", "src", "main", "assets")
shutil.copy2(os.path.join(BASE_DIR, "index.html"), os.path.join(assets_dst, "index.html"))
shutil.copy2(os.path.join(BASE_DIR, "styles.css"), os.path.join(assets_dst, "styles.css"))
shutil.copy2(os.path.join(BASE_DIR, "app.js"), os.path.join(assets_dst, "app.js"))
shutil.copy2(os.path.join(BASE_DIR, "lib", "chart.js"), os.path.join(assets_dst, "lib", "chart.js"))
shutil.copy2(os.path.join(BASE_DIR, "lib", "lucide.js"), os.path.join(assets_dst, "lib", "lucide.js"))
print("[OK] Web assets copied to assets folder")

# 4. Copy Launcher Icons
icons_src = os.path.join(STUDY_BOARD_BASE, "icons")
icon192 = os.path.join(icons_src, "icon-192.png")
for mipmap in ["mipmap-hdpi","mipmap-mdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi"]:
    dest = os.path.join(PROJECT_DIR, "app", "src", "main", "res", mipmap, "ic_launcher.png")
    shutil.copy2(icon192, dest)
    shutil.copy2(icon192, dest.replace("ic_launcher.png", "ic_launcher_round.png"))

# 5. settings.gradle
open(os.path.join(PROJECT_DIR, "gradle.properties"), "w").write("""\
android.useAndroidX=true
android.enableJetifier=true
""")

open(os.path.join(PROJECT_DIR, "settings.gradle"), "w").write("""\
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "FamilySavings"
include ':app'
""")

# 6. Root build.gradle
open(os.path.join(PROJECT_DIR, "build.gradle"), "w").write("""\
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.3.2'
    }
}
""")

# 7. gradle-wrapper.properties & gradlew.bat
open(os.path.join(PROJECT_DIR, "gradle/wrapper/gradle-wrapper.properties"), "w").write("""\
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
""")

# Check for existing gradle-wrapper.jar or download
gradle_jar_path = os.path.join(PROJECT_DIR, "gradle", "wrapper", "gradle-wrapper.jar")
existing_jar = os.path.join(STUDY_BOARD_BASE, "twa-project", "gradle", "wrapper", "gradle-wrapper.jar")
if os.path.exists(existing_jar):
    shutil.copy2(existing_jar, gradle_jar_path)
    print("[OK] Copied existing gradle-wrapper.jar")
else:
    print("Downloading gradle-wrapper.jar...")
    gradle_jar_url = "https://raw.githubusercontent.com/gradle/gradle/v8.4.0/gradle/wrapper/gradle-wrapper.jar"
    subprocess.run(["curl.exe", "-L", "-o", gradle_jar_path, gradle_jar_url], env=env, check=True)

open(os.path.join(PROJECT_DIR, "gradlew.bat"), "w").write("""\
@rem Gradle startup script for Windows
@echo off
set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%
set CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar
"%JAVA_HOME%\\bin\\java.exe" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
""")

# 8. app/build.gradle
open(os.path.join(PROJECT_DIR, "app/build.gradle"), "w").write(f"""\
plugins {{
    id 'com.android.application'
}}

android {{
    namespace '{PACKAGE_ID}'
    compileSdk 34

    defaultConfig {{
        applicationId '{PACKAGE_ID}'
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName '{VERSION}'
    }}

    buildTypes {{
        release {{
            minifyEnabled false
            signingConfig signingConfigs.debug
        }}
        debug {{
            signingConfig signingConfigs.debug
        }}
    }}

    compileOptions {{
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }}

    buildToolsVersion '34.0.0'
}}

dependencies {{
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.11.0'
}}
""")

# 9. MainActivity.java
open(os.path.join(PROJECT_DIR, "app/src/main/java/com/familysavings/app/MainActivity.java"), "w").write("""\
package com.familysavings.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
""")

# 10. AndroidManifest.xml
open(os.path.join(PROJECT_DIR, "app/src/main/AndroidManifest.xml"), "w").write(f"""\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="{APP_NAME}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/Theme.AppCompat.NoActionBar"
        android:supportsRtl="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
""")

# 11. res/values/strings.xml
open(os.path.join(PROJECT_DIR, "app/src/main/res/values/strings.xml"), "w").write(f"""\
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">{APP_NAME}</string>
</resources>
""")

print("[OK] All Android native project files created")

# 12. Build APK
print("\nBuilding APK with Gradle...")
run([
    os.path.join(PROJECT_DIR, "gradlew.bat"),
    "assembleDebug",
    "--no-daemon",
    f"-Pandroid.sdk.path={ANDROID_SDK}"
], cwd=PROJECT_DIR)

# 13. Find and copy APK
apk_dir = os.path.join(PROJECT_DIR, "app", "build", "outputs", "apk", "debug")
apks = [f for f in os.listdir(apk_dir) if f.endswith(".apk")]
if apks:
    src = os.path.join(apk_dir, apks[0])
    dst = os.path.join(BASE_DIR, "FamilySavingsAccount.apk")
    downloads_dst = r"c:\Users\Monisha\Downloads\FamilySavingsAccount.apk"
    shutil.copy2(src, dst)
    shutil.copy2(src, downloads_dst)
    size = os.path.getsize(dst) // 1024
    print(f"\n[SUCCESS] FamilySavingsAccount.apk created ({size} KB)")
    print(f"   Primary Location: {dst}")
    print(f"   Downloads Location: {downloads_dst}")
else:
    print("ERROR: No APK file generated!")
    sys.exit(1)

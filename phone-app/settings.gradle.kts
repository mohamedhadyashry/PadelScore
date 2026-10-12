pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // Huawei Wear Engine SDK lives here
        maven { url = uri("https://developer.huawei.com/repo/") }
    }
}

rootProject.name = "PadelScore"
include(":app")

# my-iot

MyIOT application 
Vue 3 in Vite

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```


build for android 

install android studio and build tools 33.0.2

```sh
npm install -g cordova
```

```sh
vue add cordova
```

```sh
vue add cordova
```

```sh
npm run cordova-build-android  
```


NOTES:
- You need android studio to build the final apk
- Open android studio project under my-iot\src-cordova\platforms\android


Add the below line in your application tag:

android:usesCleartextTraffic="true"
As shown below:

<application
....
android:usesCleartextTraffic="true"
....>

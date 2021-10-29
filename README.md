# Project
Made during the security lecture 2021, a little website to use with the backend to validate covid certificates with the current (Oct 2021) rules in Switzerland.

## Usage
1. `Scan` uses the camera to try to detect the QR code.
1. Next to the scan you can upload an image of the QR code. 
1. If the QR code is valid, it will stay, and the border around the now visible information is green
1. If it is not valid, then the code will shake and disappear, the information box now has a red border
1. Demo certificates wont work, as the keys are not in the trustlist. This is what is expected and needed

## Live server
https://eldnn.github.io/covid-qr-frontend/

## Run it local
1. Clone the repo and change into its directory
1. open index.html

## Run local backend
Make sure to change the verify url in the frontend (qr-impl.js:6) to http://localhost:3000/verify

## Compatibility
Tested on Firefox 93.0 and Firefox for Android 94. The camera and live feed may not work on every device.

## Installation

### Node.js

To use the `pegjs` command, install PEG.js globally:

```console
$ npm install -g pegjs
```

To use the JavaScript API, install PEG.js locally:

```console
$ npm install pegjs
```

If you need both the `pegjs` command and the JavaScript API, install PEG.js both ways.

If you plan to use the `pegjs` command only in your `package.json`, it is suggested you install it locally only, as all locally installed packages that contain command line tools are available to it.

### Browser

[Download](https://pegjs.org/#download) the PEG.js library (regular or minified version) or use it directly using UNPKG:

```html
<script src="https://unpkg.com/pegjs/dist/peg.min.js"></script>
```

### Latest

To use the latest features, fixes and changes of PEG.js, install the packaged dev release:

```console
$ npm install pegjs@dev
```

On the browser you can use UNPKG again:

```html
<script src="https://unpkg.com/pegjs@dev/dist/peg.min.js"></script>
```

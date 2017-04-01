# Twixly UI Extensions API Reference

This document describes the API that an extension can use to communicate
with the Twixly Management App.

## Table of Contents

- [Inclusion into your project](#inclusion-in-your-project)
- [Initialization](#initialization)
- [`extension.itemType`](#extensionitemType)
- [`extension.field`](#extensionfield)
- [`extension.item`](#extensionitem)
  - [`item.fields[id]`](#itemfieldsid-field)
- [`extension.bucket`](#extensionbucket)
  - [Item types](#content-types)
  - [Items](#items)
  - [Assets](#assets)
- [`extension.locales`](#extensionlocales)
- [`extension.window`](#extensionwindow)
- [`extension.dialogs`](#extensiondialogs)

## Inclusion in your project

You will need to include the
[twixly-extensions-sdk](https://github.com/twixlyhq/ui-extensions-sdk)
library in your HTML5 app:

```html
<script src="https://unpkg.com/twixly-ui-extensions-sdk"></script>
```

The SDK is also distributed as an [NPM package][package].

```bash
npm install --save twixly-ui-extensions-sdk
```

You can include it in your code base with

```javascript
var twixlyExtension = require('twixly-extensions-sdk')
```

## Initialization

The SDK exposes the `twixlyExtension.init()` method. This is the main entry
point for all extension related code. If you require the script from the web
without any module system the item point is available as

```javascript
window.twixlyExtension.init(function (extension) {
  var value = extension.field.getValue()
  extension.field.setValue("Hello world!")
})
```

If you use a CommonJS packager for the browser (e.g. [Browserify]) you need to
require the Extensions SDK.

```javascript
var twixlyExtension = require('twixly-ui-extensions-sdk')
twixlyExtension.init(function (extension) {
  /* ... */
})
```

## `extension.itemType`

This API gives you access to data about the item type and the item. It has
the form as described under "item type properties" in our [api
documentation](https://www.twixly.com/developers/docs/references/content-management-api/#/reference/content-types).

_Since 1.0.0_

## `extension.field`

This API gives you access to the value and metadata of the field the extension
is attached to.

If you use localization, a extension instance will be rendered for each locale.
This means you can only change the value for the given locale. See the
[`item.fields` API](#itemfieldsid-field) for how to change values for
different locales.

If an item returned by the twixly Management API looks like the following:

```javascript
{
  sys: { ... },
  fields: {
    title: {
      "en_US": "My Post"
    },
    ...
  }
}
```

Then the extension is attached to the `title` field and the `en_US` locale.

### `extension.field.getValue(): mixed`

Gets the current value of the field and locale. In the example this would yield
`"My Post"`.

### `extension.field.setValue(value): Promise<void>`

Sets the value for the field. The promise is resolved when the change
has been acknowledged. The type of the value must match the expected field type.
For example, if the extension is attached to a "String" field you must pass a
string.

### `extension.field.removeValue(value): Promise<void>`

Removes the value for the field and locale. A subsequent call to `getValue()`
for the field would yield `undefined`.

### `extension.field.setInvalid(Boolean): undefined`

Communicates to the twixly web application if the field is in a valid state
or not. This impacts the styling applied to the field container.

### `extension.field.onChange(cb): function`

Calls the callback every time the value of the field is changed by an external
event (e.g. when multiple editors are working on the same item) or when
`setValue()` is called.

The method returns a function you can call to stop listening to changes.

### `extension.field.onSchemaErrorsChanged(cb): function`

Calls the callback immediately with the current validation errors and whenever
the field is re-validated. The callback receives an array of error objects. An
empty array indicates no errors.

The errors are updated when the app validates an item. This happens when
loading an item or when the user tries to publish it.

The method returns a function that you can call to stop listening to changes.

### `extension.field.id: string`

The ID of a field is defined in an item's item type. Yields `"title"` in the
example.

### `extension.field.locale: string`

The current locale of a field the extension is attached to. Yields `"en_US"` in
the example.

### `extension.field.type: string`

Holds the type of the field the extension is attached to. The field type can be
one of those described [in our api
documentation](https://www.twixly.com/developers/docs/references/content-management-api/#/reference/content-types).

### `extension.field.validations: Validation[]`

A list of validations for this field that are defined in the item type. The
[item type
documentation](https://www.twixly.com/developers/docs/references/content-management-api/#/reference/content-types/content-type/create/update-a-content-type)
provides more information on the shape of validations.

## `extension.item`

This object allows you to read and update the value of any field of the current
item and to get the item's metadata.

### `item.getSys(): object`

Returns metadata for an item. The value coincides with the `sys` value of an
item returned by the `v0.8.x` of the [twixly Management
API](https://github.com/twixly/twixly-management.js/tree/legacy#item-properties).

### `item.onSysChanged(cb): function`

Calls the callback with metadata every time that metadata changes. You can call
the returned function to stop listening to changes.

### `item.fields[id]: Field`

In addition to [`extension.field`](#extensionfield), a extension can also
control the values of all other fields in the current item. Fields are
referenced by their ID.

The `Field` API methods provide a similar interface to `extension.field`. The
methods also accept an optional locale to change the value for a specific
locale. It defaults to the bucket the bucket's default locale (see
[`extension.locales`](#extensionlocales)). Providing an unknown locale throws an
exception.

- `field.id: string`
- `field.locales: Array<string>`
- `field.getValue(locale?): mixed`
- `field.setValue(value, locale?): Promise<void>`
- `field.removeValue(locale?): Promise<void>`
- `field.onChange(locale?, cb): function`

#### Example

If the item has a "title" field, you can transform it to upper case with:

```javascript
var titleField = extension.item.fields.title
var oldTitle = titleField.getValue()
titleField.setValue(oldTitle.toUpperCase())
```

## `extension.bucket`

The `bucket` object exposes methods that allow the extension to read and
manipulate a wide range of objects in the bucket.

### Item Types
### items
### Media

Allows operating on the current bucket's item types. Item types
created/updated or deleted this way will immediately be published or unpublished
respectively.

- `bucket.get([item-type, item, media], options)`
- `bucket.get([item-type, item, media]/[id], options)`
- `bucket.post([item-type, item, media], data)`
- `bucket.put([item-type, item, media], data)`
- `bucket.delete(id)`

## `extension.window`

The window object provides methods to update the size of the iframe the
extension is contained within. This prevents scrollbars inside the extension.

To prevent a flickering scrollbar during height updates, it is recommended to
set the extension's `body` to `overflow: hidden;`.

### `window.updateHeight()`

Calculates the body's `scrollHeight` and sets the containers height to this
value.

### `window.updateHeight(height)`

Sets the iframe height to the given value in pixels. `height` must be an
integer.

### `window.startAutoResizer()`

Listens for DOM changes and calls `updateHeight()` when the size changes.

### `window.stopAutoResizer()`

Stops resizing the iframe automatically.

## `extension.dialogs`

This object provides methods for opening UI dialogs:

### `dialogs.selectSingleitem(options)`

Opens a dialog for selecting a single item. It returns a promise resolved with
the selected entity or `null` if a user closes the dialog without selecting
anything.

`options` is an optional object configuring the dialog.The available `options`
are:

- `locale`: The code of a locale you want to use to display proper titles and
descriptions. Defaults to the bucket's default locale.
- `itemTypes`: An array of item type IDs of items that you want to
display in the selector. By default items of all item types are displayed.

```javascript
// display a dialog for selecting a single item
dialogs.selectSingleitem().then((selecteditem) => {})

// select a single item of "blogpost" item type
// and display result in "de-DE" locale
dialogs.selectSingleitem({
  locale: 'de-DE',
  itemTypes: ['blogpost']
}).then((selecteditem) => {})
```

### dialogs.selectMultipleitems(options)

Works similarly to `selectSingleitem`, but allows to select multiple items
and the returned promise is resolved with an array of selected items.

Both `locale` and `itemTypes` options can be used. There are two additional
options:

- `min` and `max` - numeric values specifying an inclusive range in which the
number of selected entities must be contained

```javascript
// display a dialog for selecting multiple items
dialogs.selectMultipleitems().then((arrayOfSelecteditems) => {})

// select between 1 and 3 (inclusive) items
dialogs.selectMultipleitems({min: 1, max: 3})
.then((arrayOfSelecteditems) => {})
```

### `dialogs.selectSingleAsset(options)`

Counterpart of `selectSingleitem` for assets. A `itemTypes` option is not
available.

### `dialogs.selectMultipleAssets(options)`

Counterpart of `selectMultipleitems` for assets. A `itemTypes` option is
not available.

[browserify]: http://browserify.org/
[cma-js]: https://github.com/twixly/twixly-management.js/tree/legacy
[package]: https://www.npmjs.com/package/twixly-ui-extensions-sdk
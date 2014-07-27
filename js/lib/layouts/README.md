
# Mortar Layouts

This is a UI library that is used in many of the [mortar](https://github.com/mozilla/mortar) templates. Mortar is a collection of templates that help developers get started writing web apps quickly, whether it's for Firefox OS or other platforms.

It is powered by [backbone.js](http://backbonejs.org/) so that you can quickly use "models" to work with your app's data. Any changes to this data are propagated across the app automatically.

For now, this library is only usable with [require.js](http://requirejs.org/). In the future we will most likely make this optional.

This library requires [backbone.js](http://backbonejs.org/), [zepto](http://zeptojs.com/), [underscore](http://underscorejs.org/), and [x-tags](https://github.com/mozilla/x-tag). If you use the [mortar templates](https://github.com/mozilla/mortar/), all of this is already hooked up for you.

# Installation

Download this library and put it somewhere that [require.js](http://requirejs.org/) can find it. Somewhere in your app, simply add this javascript:

```js
require('layouts/layouts');
```

This assumes that the library was downloaded to a `layouts` library the requirejs finds. Your actual path may be different. The important thing is to include the layouts.js file from this project.

This installs the `x-view` and `x-listview` tags.

# Usage

## HTML

This library introduces two tags using the [x-tags](https://github.com/mozilla/x-tag) library, a polyfill for the [Web Components](http://dvcs.w3.org/hg/webcomponents/raw-file/tip/explainer/index.html) specification.

### x-view

The `x-view` tag is a basic building block like `div`. The difference is that it has a few special features specific for building apps.

* Every `x-view` tag has a [backbone.js](http://backbonejs.org/) [view](http://backbonejs.org/#View) instance. This means that it's easy to display your data, and updates are automatically propagated across your app.

* A `div` tag is meant to group content into different places on the page. An `x-view` tag is different; it is primarily meant to separate "pages" in your app. For example, when several `x-view` tags are siblings, only one is displayed at a time. The app is meant to "open" and "close" the other views.

* Each `x-view` tag has a navigation stack. If you open a view by pushing it onto another one, it is added to the stack. When the opened view is closed, the user will see the original view that was displayed.

* If a `data-first` attribute on an `x-view` tag is set to "true", it will appear first instead of any of its sibling `x-view` tags. By default, the first `x-view` in a set of `x-view` siblings is shown.

* You can compose and nest `x-view` tags. One example of why you'd want to do this is if you wanted a global header or footer. If you have a global `x-view` and several `x-view` tags inside of it, the global `x-view` header and/or footer will still appear while its children are being displayed individually.

* A `header` child element of `x-view` is special. It is pinned at the top of the view and comes with a few default styles, which you can override in CSS.
  * An `h1` inside of a `header` **is required**. It is centered and set as the title for the view.
  * When a view with a header is added to the navigation stack, a "back" button is automatically added to the header.

* A `footer` child element of `x-view` is special also. It is pinned at the bottom of the view and comes with default styles.

* A `button` element inside of a `header` or `footer` is special; it receives some default styles and is meant to to used to open other views. Because of this, it has two data attributes that customize its behavior:
  * `data-view`: Specifies the view to open when pressed. The value is a CSS selector which selects the `x-view` tag. Example: `<button data-view=".myview">MyView</button>`
  * `data-push`: If set to "true", always push the view onto the view stack. Usually if the view being opened does not cover up this button, it instead simply makes it appear and does not push it onto the navigation stack. Use this to force the "push" behavior. Example: `<button data-view=".myview" data-push="true">MyView</button>`

### x-listview

The `x-listview` tag is exactly like the `x-view` tag, except it manages a list of items and displays it for you. The backbone view attached to the list view tag manages a collection of items, and it is automatically displayed as a list.

### Example

Here's how a simple list-detail app would look:

```html
<html>
  <head>
    <title>My Awesome App</title>
  </head>
  <body>
    <x-listview class="list">
      <header>
        <h1>My Items</h1>
        <button data-view=".new">Add New</a>
      </header>
    </x-listview>

    <x-view class="detail">
      <header>
        <h1>Details</h1>
      </header>

      <h1 class="title"></h1>
      <p class="desc"></p>
      <p class="date"></p>
    </x-view>

    <x-view class="new">
      <header>
        <h1>New</h1>
      </header>

      Title: <input type="text" name="title" />
      Description: <input type="text" name="desc" />
      <button type="submit" class="add">Add</button>
    </x-view>
  </body>
</html>
```

In this example, you would only see the first `x-listview` tag because when `x-view` tags have siblings, only one is shown at a time. When the "Add New" button is clicked, the `.new` tag slides in and a back button is added to the header. Lastly, when an item is clicked in the list, the `.detail` tag is shown. How that happens is described below.

[View some more example HTML](https://github.com/mozilla/mortar-list-detail/blob/master/www/index.html) from the mortar-list-detail template.

## CSS

You can style an `x-view`, `x-listview`, or any of the headers and footers any way you like.

The only thing to note is that all of the contents in the view tags live inside a `div` with a `contents` class. This is done so that you can easily give padding to your content without breaking the width or height of the element. This wrapper div flows with your content so it's height equals the height of your content.

Here's how you give padding to content inside your `x-view` tags. If you want to change something like the background color, you should apply it directly to the `x-view` tag instead of `.contents` so that it fills the whole tag.

```css
x-view .contents {
    padding: 1em;
}
```

## Javascript

Obviously `x-view` and `x-listview` are not purely about presentation, they have special behaviors too. You can customize and extend these behaviors with the javascript API.

For example, in the above HTML, there's nothing that opens up the `.detail` view. You have to tell the `x-listview` what to open when a list item is clicked, so for above you would give it the CSS selector `.detail`.

[x-tags](https://github.com/mozilla/x-tag) allows us to define properties on native DOM elements. The API for this library is simply a set of properties on each `x-view` and `x-listview` tag.

You should also be familiar with backbone.js [models](http://backbonejs.org/#Model). Basically a model is an object with fields and values.

### x-view

Assuming `tag` is an instance of an `x-view` tag:

* **`tag.titleField = 'title'`**

Set the item field for the title. This defaults to "title". You can use this when your view has a backbone.js model attached to it. When opened, it will automatically change the title in the `header` tag to the value of the specified field in the model.

* **`tag.render = function(model) { ... }`**

Set the function for rendering the tag. This is only helpful if a model is attached to the view, and it is called every time it is opened. The model will be passed as the first argument. The `this` object is bound to the `x-view` or `x-listview` DOM element. Use this to dynamically render the model.

* **`tag.getTitle = function(model) { ... }`**

Set the function for dynamically generating a title. Called whenever the view opens. Use this to generate a title based off a model, which is passed as the first argument.

* **`tag.model`**

Get or set the model from the backbone view.

* **`tag.onOpen = function() { ... }`**

Set a callback for when the view is opened.

* **`tag.open(model, anim)`**

Open the view with the model and animation (both are optional). See below for currently available animations. If you want to specify just the animation, pass `null`, for the model. By default, there is no animation.

* **`tag.close(anim)`**

Close the view with the animation (optional). By default, there is no animation.

The currently available animations are `instant`, `instantOut`, `slideLeft`, and `slideRightOut`.

### x-listview

All of the properties/methods from `x-view` are available except `render` and `model`. The following are additional properties/methods:

* **`tag.renderRow = function(model) { ... }`**

Set the function for rendering a row. By default, it simply shows the field from the model specified by the `titleField` option (see the `x-view` API), which defaults to "title".

* **`tag.nextView = '<CSS selector>'`**

Set the view to open when a row is selected (as a CSS selector).

* **`tag.collection`**

Get or set the view's collection.

* **`tag.add(item)`**

Add an item to the list. You can pass a raw javascript has like `{ name: 'James', age: 28 }` or an actual backbone model instance. The item will be immediately rendered in the list.

[View some example code in the mortar-list-detail project](https://github.com/mozilla/mortar-list-detail/blob/master/www/js/app.js).

For example, to add items to the list, just grab the list tag and add them.

```js
var list = $('.list').get(0);
list.add({ title: "Foo", desc: "Foo is a thing" });
list.add({ title: "Bar", desc: "Bar is something else" });
```

Those items will automatically appear in the list according to your `renderRow` function.

## Advanced Layouts

So far, you've learned how to make a single-page app with some headers and footers. What if you want to show several views at once, like a vertically split pane?

It's really easy to do that, actually.

By default, an `x-view` fills up it's parent container. The parent chooses one `x-view` tag to show out of its children (usually the first one, but you can change it with `data-first`). However, if you don't want this behavior, you turn on a "manual layout".

A "manual layout" tells an `x-view` that you're going to manually rearrange it's children. This is needed because it will allow you to show multiple child views at once, and also disable some extra markup that makes it easier to give padding to content.

You enable it with the `data-layout` attribute:

```html
<style type="text/css">
  .left {
      width: 50%;
  }

  .right {
      width: 50%;
      left: 50%;
  }
</style>

<x-view data-layout="manual">
  <header>
    <h1>My App</h1>
  </header>
  
  <x-view class="left">
    This content will be on the left.
  </x-view>

  <x-view class="right">
    This content will be on the right.
  </x-view>
</x-view>
```

Note the `data-layout` attribute on the top-level `x-view`, and the CSS to set the widths of the child `x-view` tags to 50% and move the second one over by 50%. However, the header still spans the width of the top-level `x-view` as you would expect.

In fact, `x-view` tags that aren't a child of another `x-view` tag acts exactly as they would in manual layout mode. That is, you can pretty much do whatever you want with them with standard HTML tags and CSS.

```html
<style type="text/css">
  .left {
      position: relative;
      width: 50%;
  }

  .right {
      position: relative;
      width: 50%;
      left: 50%;
  }
</style>

<div class="left">
  <x-view>
    This will be on the left.
  </x-view>
</div>

<div class="right">
  <x-view>
    This will be on the right.
  </x-view>
</div>
```

An `x-view` tag simply fills up it's parent container and obeys it. The **only caveat** is that you **must** set `position: relative` on the parent tag so that the view is anchored to it.

At this point you may be thinking, why even use the view tags at all? Well, if you want a navigation stack, header, or footer, you will want to use it. The point is is that it obeys the web and you can use it anywhere you want, whether it's a fullscreen `x-view`, just part of an app, or many `x-view` tags stacked together.

In the above example, **you don't actually even need the extra divs**. You could simply apply the `width` and `left` CSS straight on the tags. I added them in the example to demonstrate how `x-view` tags work within other tags.

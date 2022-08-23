# www

a "zero-config" static site builder mostly for me. write html to build sites out of html
with minimal tooling and mostly just html. a companion to [www-os](https://github.com/tycobbb/www-os).

it can build your site. it has a dev server that rebuilds as you make changes (though you still have to reload). it has templating (if you want it). it has build-time data (if you want it). it can change the directory it builds your site to!


## install

install [deno](#install-deno), if you haven't already.

install the tool (this is a long one):

```sh
$ deno install --allow-env --allow-run --allow-read --allow-write --allow-net https://deno.land/x/wvvw@0.0.5/www.ts
```

### deno

you can install [deno](https://deno.land/#installation) many ways. personally, i use [asdf](https://github.com/asdf-vm/asdf) to manage language/runtime installs, and you can too using these [instructions](https://github.com/denoland/deno_install#install-and-manage-multiple-versions).

you also need to add deno's bin directory to your path. for most installs, that will be `~/.deno/bin`. if you use [asdf](https://github.com/asdf-vm/asdf), it's going to be `$(asdf where deno)/.deno/bin`.

### future

deno can build "standalone binaries". they bundle most of deno along with it and are kind of big. but
at some point soon, i'll figure out a nice way to package that up to make it easier to install if you don't otherwise
care about deno.

## use

to run the dev server:

```sh
$ www --up .
```

to build your site

```sh
$ www .
```

to build your site for production:

```sh
$ www --prod .
```

to see help:

```sh
$ www --help
```

## structure

organize your directory however you want. the structure of your site will mirror your directory structure. if you just want to look at examples, check out the [test site](./test/fixtures/) or [my webiste](https://github.com/tycobbb/website).

your directory structure and any files you create will be copied into your built site as they are. if you want want to write plain html, you can write plain html!

there are a few special file types that you can use if you want to use fancier static-site features like templating, shared layouts, html fragments, &c. within those, there are also some special build-time html features you can use, but i'll have to document them later.

## is this for me?

maybe! i like it a lot. if you really just want to write html and want to repeat yourself a little less, this might be for you too. but it'also not very well documented, probably pretty buggy, and missing features.

## todos

- [ ] add `w-frag` (see [notes](./notes.md))
- [ ] add `w-slot` (see [notes](./notes.md))
- [ ] init command
- [ ] package a binary
- [ ] ???
- [ ] you [tell me](https://github.com/tycobbb/www/issues)
- [ ] or better yet, [implement it](https://github.com/tycobbb/www/compare)

## thanks

thanks to [the parks staff](https://twitter.com/theparksstaff) and their website [dumpling.love](https://dumpling.love). influenced by other similar tools like [sergey](https://github.com/trys/sergey). inspired by the power of [html.energy](https://html.energy).
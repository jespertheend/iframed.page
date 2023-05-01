/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.185.0/http/mod.ts";
import { h, renderSSR } from "https://deno.land/x/nano_jsx@v0.0.37/mod.ts";
import { processString } from "npm:uglifycss@0.0.29";

const dev = Deno.args.includes("--dev");

serve(async (request) => {
	const url = new URL(request.url);

	let content;
	if (url.pathname == "/") {
		content = (
			<form>
				<input></input>
				<button type="submit">Go</button>
			</form>
		);
	} else if (url.pathname == "/style.css") {
		const css = await Deno.readTextFile("./style.css");
		return new Response(css, {
			headers: {
				"content-type": "text/css",
			},
		});
	} else {
		const src = url.pathname.substring(1);
		content = (
			<div id="iframeContainer">
				<iframe src={src}></iframe>
			</div>
		);
	}

	let styleComponent;
	if (dev) {
		styleComponent = <link rel="stylesheet" href="/style.css" type="text/css" />;
	} else {
		const css = await Deno.readTextFile("./style.css");
		styleComponent = <style>{processString(css)}</style>;
	}

	const rendered = renderSSR(
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>iframe.page</title>
				<meta name="description" content="Render any page inside an iframe" />
				{styleComponent}
			</head>
			<body>
				{content}
			</body>
		</html>,
	);
	return new Response("<!DOCTYPE html>" + rendered, {
		headers: {
			"content-type": "text/html; charset=utf-8",
		},
	});
});

import { serve, Status } from "https://deno.land/std@0.185.0/http/mod.ts";
import { h, renderSSR } from "https://deno.land/x/nano_jsx@v0.0.37/mod.ts";
import { processString } from "https://esm.sh/uglifycss@0.0.29";

const dev = Deno.args.includes("--dev");

function PageForm({
	value = "",
	autofocus = false,
}: {
	value?: string;
	autofocus?: boolean;
}) {
	const inputParams: { autofocus?: boolean } = {};
	if (autofocus) {
		inputParams.autofocus = true;
	}
	return (
		<form action="/" method="get">
			<input name="page" placeholder="Enter a URL" value={value} {...inputParams}></input>
			<button type="submit">Go</button>
		</form>
	);
}

serve(async (request) => {
	const url = new URL(request.url);

	let content;
	if (url.pathname == "/") {
		const page = url.searchParams.get("page");
		if (page) {
			return new Response(null, {
				status: Status.Found,
				headers: {
					Location: "/" + page,
				},
			});
		}
		content = () => <PageForm autofocus></PageForm>;
	} else if (url.pathname == "/style.css") {
		const css = await Deno.readTextFile("./style.css");
		return new Response(css, {
			headers: {
				"content-type": "text/css",
			},
		});
	} else {
		const src = url.pathname.substring(1);
		try {
			new URL(src);
		} catch {
			return new Response(null, {
				status: Status.Found,
				headers: {
					Location: "/https://" + src,
				},
			});
		}
		content = () => (
			<div id="pageContainer">
				<PageForm value={src}></PageForm>
				<iframe src={src}></iframe>
			</div>
		);
	}

	let styleComponent;
	if (dev) {
		styleComponent = () => <link rel="stylesheet" href="/style.css" type="text/css" />;
	} else {
		const css = await Deno.readTextFile("./style.css");
		styleComponent = () => <style>{processString(css)}</style>;
	}

	const rendered = renderSSR(() => (
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
		</html>
	));
	return new Response("<!DOCTYPE html>" + rendered, {
		headers: {
			"content-type": "text/html; charset=utf-8",
		},
	});
});

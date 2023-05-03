import { serve, Status } from "https://deno.land/std@0.185.0/http/mod.ts";
import { Fragment, h, JSX } from "https://esm.sh/preact@10.5.15";
import { renderToString } from "https://esm.sh/preact-render-to-string@5.1.19?deps=preact@10.5.15";
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
		<form autocomplete="off" spellcheck={"false" as unknown as boolean} autocorrect="off" action="/" method="get">
			<input class="styled-input" name="page" placeholder="Enter a URL" value={value} {...inputParams}></input>
			<button type="submit" class="styled-input">Go</button>
		</form>
	);
}

function Footer() {
	return (
		<div class="footer">
			<a href="https://github.com/jespertheend/iframed.page" target="_blank">GitHub</a>
		</div>
	);
}

serve(async (request) => {
	const url = new URL(request.url);

	let content: JSX.Element;
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
		content = (
			<>
				<PageForm autofocus></PageForm>
				<Footer></Footer>
			</>
		);
	} else if (url.pathname == "/style.css") {
		const css = await Deno.readTextFile("./style.css");
		return new Response(css, {
			headers: {
				"content-type": "text/css",
			},
		});
	} else if (url.pathname == "/robots.txt") {
		return new Response("not found", {
			status: Status.NotFound,
		})
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
		content = (
			<>
				<PageForm value={src}></PageForm>
				<iframe src={src}></iframe>
			</>
		);
	}

	let styleComponent: JSX.Element;
	if (dev) {
		styleComponent = <link rel="stylesheet" href="/style.css" type="text/css" />;
	} else {
		const css = await Deno.readTextFile("./style.css");
		styleComponent = <style>{processString(css)}</style>;
	}

	const rendered = renderToString(
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>iframe.page</title>
				<meta name="description" content="Render any page inside an iframe" />
				{styleComponent}
			</head>
			<body>
				<div id="pageContainer">
					{content}
				</div>
			</body>
		</html>,
	);
	return new Response("<!DOCTYPE html>" + rendered, {
		headers: {
			"content-type": "text/html; charset=utf-8",
		},
	});
});

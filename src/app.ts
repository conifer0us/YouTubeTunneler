import express from "express";
import "http-proxy-middleware";

const app = express();
const port: number = 8000;

const dailyVideos: Set<string> = new Set<string>();

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("no homepage privileges for you");
});

app.get("/watch", async (req: express.Request, res: express.Response) => {
    const vID: string = req.query.v as string;

    const hasWatchedAlready: boolean = dailyVideos.has(vID);

    if (!vID || (dailyVideos.size == 5 && !hasWatchedAlready)) {
        res.status(404).send();
        return;
    }

    const reqHeaders: HeadersInit = new Headers();

    Object.entries(req.headers).forEach(([k, v]) => {
        reqHeaders.append(k, v as string);
        reqHeaders.set("host", "youtube.com");
    });

    const ytResponse: Response = await fetch(
        `https://youtube.com/watch?v=${vID}`,
    );

    if (!hasWatchedAlready && ytResponse.ok) {
        dailyVideos.add(vID);
    }

    res.status(ytResponse.status).send(await ytResponse.text());
});

app.all("/*", async (req, res) => {
    const ytPath: string = req.url.replace(req.baseUrl, "");

    const ytResponse: Response = await fetch(`https://youtube.com${ytPath}`);

    res.status(ytResponse.status).send(ytResponse.text());
});

app.listen(port, () => {
    console.log("Started tunneler on Port 8000");
});

import express from "express";
import "http-proxy-middleware";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const port: number = 8000;

const dailyVideos: Set<string> = new Set<string>();

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("no homepage privileges for you");
});

app.get("/watch", async (req: express.Request, res: express.Response) => {
    const vID: any = req.query.v;
    if (typeof vID != "string") {
        res.status(404).send();
    }

    const hasWatchedAlready: boolean = dailyVideos.has(vID);

    if (!vID || (dailyVideos.size == 5 && !hasWatchedAlready)) {
        res.status(404).send();
        return;
    }

    fetch(`https://youtube.com/watch?v=${vID}`)
        .then((response) => {
            response.body.pipeTo(
                new WritableStream({
                    start() {
                        res.statusCode = response.status;
                        response.headers.forEach((v, n) => res.setHeader(n, v));
                    },
                    write(chunk) {
                        res.write(chunk);
                    },
                    close() {
                        // Adds video to store if response successful and the video is new
                        if (!hasWatchedAlready && response.ok) {
                            dailyVideos.add(vID);
                        }

                        res.end();
                    },
                }),
            );
        })
        .catch((err) => {
            res.status(500).send(err);
        });
});

app.listen(port);

import db from "../config/db.js";

export const scrapeReddit = async () => {
  const redditRes = await fetch(
    "https://www.reddit.com/r/artificial/new.json?limit=10",
    {
      headers:{ "User-Agent":"SherlockAI/1.0" }
    }
  );

  let redditData:any = null;

  if(redditRes.ok){
    redditData = await redditRes.json();
  }

  let newSignals = 0;

  const insertSignal = db.prepare(
    "INSERT OR IGNORE INTO signals (source,title,url,content) VALUES (?,?,?,?)"
  );

  if(redditData?.data?.children){
    for(const child of redditData.data.children){
      const post = child.data;
      const result = insertSignal.run(
        "reddit",
        post.title,
        `https://reddit.com${post.permalink}`,
        post.selftext || ""
      );

      if(result.changes > 0){
        newSignals++;
      }
    }
  }

  return newSignals;
};

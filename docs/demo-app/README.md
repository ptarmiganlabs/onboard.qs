# Onboard.qs demo apps

Three Qlik Sense apps that show what Onboard.qs can do:

| File                              | Language | What it shows                                      |
| --------------------------------- | -------- | -------------------------------------------------- |
| `Onboard.qs demo (EN).qvf`        | English  | One sheet and one style of tour at a time          |
| `Onboard.qs demo (SE).qvf`        | Swedish  | The same app in Swedish                            |
| `Onboard.qs demo Coffee (EN).qvf` | English  | Tours that tell a story with the app's own figures |

The EN and SE apps have the same four sheets and the same tours.

The coffee app is the one in the README's video. Ptarmigan Coffee is a made-up roastery that buys
green coffee from ten origins and serves it in ten Nordic cafés. Its three sheets have a map, KPIs and
charts, and its tours read like infographics: their titles and texts are Qlik expressions, worked out
from the data model as the tour runs. One of them works its figures out again at each step, so it
follows what you click on the map.

All three include their data, which the load script generates, so there are no data connections to
set up and nothing to reload.

To use them:

1. Install Onboard.qs 1.9.0 or later, as described in the README's
   [Getting Started](../../README.md#getting-started).
2. Import one or more of the files in the QMC (**Apps** › **Import**).
3. Open the app from the hub and go to sheet 1. The welcome tour starts by itself.

The [demo app tutorial](../DEMO-APP-TUTORIAL.md) walks through how every tour in the EN and SE apps is
built.

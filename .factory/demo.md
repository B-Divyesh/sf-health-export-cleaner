# Demo sandbox

Open [the demo](/demo), or use `/?demo=1`. It immediately loads a realistic
three-record wearable CSV sample with dates, device details, a location field,
and notes so the cleaning receipt and preview are visible without an upload.

The persistent **Demo — sample data, nothing is saved** banner identifies the
sandbox. **Reset demo** restores the sample and its safe day precision.
**Clean my own file** deletes the demo preference database before opening the
normal cleaner.

Health records are only page memory in either mode. The demo's timestamp
preference is isolated in IndexedDB database `demo:health-export-cleaner`; the
normal cleaner uses `health-export-cleaner`. Demo mode never reads or writes
the normal database. Each page binds its preference database once when it
opens. Reset and exit cancel unfinished sample inspection, wait for demo writes,
and finish deleting the demo database before the normal cleaner opens. If
another demo tab blocks deletion, the banner explains that it is waiting.

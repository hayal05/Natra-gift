# 10.8a check: needs `NEXT_PUBLIC_UPLOADS=1 npx next dev -p 3100` running. Fake microphone, headless Chromium (playwright for Python).
# Expected: after closing the Audio panel or switching tabs mid-recording, live=0 (microphone released) and no Stop/review controls left.
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--no-sandbox"])
    ctx = b.new_context(viewport={"width":390,"height":844}, permissions=["microphone"])
    pg = ctx.new_page()
    pg.add_init_script("""
      window.__live=0;
      const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia=async(c)=>{const s=await gum(c);
        s.getTracks().forEach(t=>{window.__live++;const st=t.stop.bind(t);t.stop=()=>{if(t.readyState==='live')window.__live--;st()}});return s};
    """)
    pg.on("pageerror", lambda e: print("PAGEERR", e))
    pg.goto("http://localhost:3100/create?t=birthday", wait_until="networkidle", timeout=120000)
    pg.wait_for_timeout(1500)
    ins=pg.query_selector_all("input[type=text], input:not([type])")
    print("inputs:",len(ins))
    for i,v in zip(ins[:2],["Natra","Sam"]): i.fill(v)
    pg.get_by_role("button",name="Continue to the pages").click(); pg.wait_for_timeout(1500)
    def phase():
        return dict(live=pg.evaluate("window.__live"),
                    stop=pg.get_by_role("button",name="Stop").count(),
                    review=pg.get_by_text("Use recording").count())
    def open_audio():
        pg.get_by_role("button",name="Audio",exact=True).first.click(); pg.wait_for_timeout(500)
    def start():
        pg.get_by_role("button",name="Record",exact=True).click(); pg.wait_for_timeout(2500)
    # Case 1: X while recording
    open_audio(); start(); print("recording:",phase())
    pg.get_by_role("button",name="Close Audio tools").click(); pg.wait_for_timeout(600)
    print("after X:",phase())
    # Case 2: switch tab while recording
    open_audio(); print("reopen idle:",phase()); start(); print("recording:",phase())
    pg.get_by_role("button",name="Style",exact=True).first.click(); pg.wait_for_timeout(600)
    print("after Style tab:",phase())
    # Case 3: finished take waiting for review, then switch tab
    open_audio(); start(); pg.get_by_role("button",name="Stop").click(); pg.wait_for_timeout(1500)
    print("review:",phase())
    pg.get_by_role("button",name="Edit",exact=True).first.click(); pg.wait_for_timeout(600)
    print("after Edit tab:",phase())
    open_audio(); print("reopen:",phase(), "Record btn:", pg.get_by_role("button",name="Record",exact=True).count())
    b.close()

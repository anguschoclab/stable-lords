from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1000)

    # Bypass FTUE by injecting a valid save state to get to the arena
    page.evaluate('''() => {
        localStorage.setItem("stablelords.save.v2", JSON.stringify({
            "version": 2,
            "roster": [
                {"id": "w1", "name": "Test Warrior A", "status": "Active", "style": "Aggressive", "grade": "Novice", "wounds": [], "quirks": [], "baseStats": {}},
                {"id": "w2", "name": "Test Warrior B", "status": "Active", "style": "Defensive", "grade": "Novice", "wounds": [], "quirks": [], "baseStats": {}}
            ],
            "arenaHistory": [{
                "id": "fight1",
                "week": 1,
                "winner": "A",
                "loser": "D",
                "warriorAId": "w1",
                "warriorDId": "w2",
                "nameA": "Test Warrior A",
                "nameD": "Test Warrior B",
                "styleA": "Aggressive",
                "styleD": "Defensive",
                "by": "KO",
                "log": [
                    {"minute": 1, "text": "Fight begins!", "events": []},
                    {"minute": 2, "text": "Warrior A hits B", "events": []},
                    {"minute": 3, "text": "Warrior A knocks out B", "events": []}
                ],
                "announcement": "What a stunning knockout!"
            }],
            "week": 2,
            "fame": 100,
            "gold": 500,
            "inventory": []
        }));
    }''')

    # Reload to apply state
    page.goto("http://localhost:8080/history")
    page.wait_for_timeout(2000)

    # We should be on history page with the fight visible. Click the first fight to open the visualizer.
    fights = page.locator(".flex.flex-col.gap-3.mt-4 > div")
    if fights.count() > 0:
        fights.first.click()
        page.wait_for_timeout(1000)

        # In the visualizer, click the play button to watch it play out
        play_btn = page.get_by_role("button", name="Play")
        if play_btn.is_visible():
            play_btn.click()
            # Wait for the 3 events to play (1 second each at 1x speed)
            page.wait_for_timeout(4000)

    # Take screenshot at the key moment
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={"width": 1280, "height": 720}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()

//-----------------------------------------------------------------------
// RNZ data app starter screen.
// The header shows the RICOH lock-up automatically. Never add another logo.
// Replace the <EmptyState /> below with your app's screens, built from the
// RNZ component kit (src/components/rnz) and the patterns in
// .agents/skills/rnz-app-patterns/SKILL.md. Keep <AppShell /> as the root.
//-----------------------------------------------------------------------

import { AppShell, Card, EmptyState, PageHeader } from "@/components/rnz";

function App() {
    return (
        <AppShell appName="RNZ app">
            <PageHeader
                title="Your app starts here"
                description="This app is connected to Fabric and styled to the RNZ Digital Design System. Describe what it should show and your coding agent will build it from the RNZ patterns."
            />
            <Card title="Next step">
                <EmptyState
                    title="No screens yet"
                    description='In VS Code, open Copilot Chat in Agent mode and type: "Build this RNZ app" followed by who it is for, what it should show and the share link to your semantic model.'
                />
            </Card>
        </AppShell>
    );
}

export default App;

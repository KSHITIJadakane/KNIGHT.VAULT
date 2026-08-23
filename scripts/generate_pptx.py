import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_top_tier_presentation(output_path="Midnight_Privacy_Payment_Vault_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Institutional Palette
    BG_COLOR = RGBColor(11, 13, 17)        # #0b0d11 Dark Canvas
    PANEL_COLOR = RGBColor(18, 21, 28)     # #12151c Surface Card
    PANEL_HIGHLIGHT = RGBColor(22, 27, 38) # #161b26 Highlighted Card
    BORDER_COLOR = RGBColor(31, 36, 46)    # #1f242e Border
    TEXT_MAIN = RGBColor(248, 250, 252)    # #f8fafc Platinum Text
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94a3b8 Slate Muted
    ACCENT_BLUE = RGBColor(59, 130, 246)   # #3b82f6 Blue
    ACCENT_GREEN = RGBColor(16, 185, 129)  # #10b981 Emerald
    ACCENT_AMBER = RGBColor(245, 158, 11)  # #f59e0b Amber
    ACCENT_ROSE = RGBColor(244, 63, 94)    # #f43f5e Rose
    ACCENT_CYAN = RGBColor(6, 182, 212)    # #06b6d4 Cyan

    def set_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="MIDNIGHT NETWORK • HACKATHON PITCH DECK"):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.name = "Arial"
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_BLUE

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.7), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = "Arial"
        p_title.font.size = Pt(20)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_MAIN

        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.48), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = BORDER_COLOR
        line.line.fill.background()

    def add_card(slide, left, top, width, height, title, items, badge=None, accent_color=ACCENT_BLUE, fill_color=PANEL_COLOR):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = fill_color
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1)

        tb = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.18), Inches(width - 0.5), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Arial"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = accent_color if accent_color else TEXT_MAIN

        tb_items = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.62), Inches(width - 0.5), Inches(height - 0.75))
        tf_items = tb_items.text_frame
        tf_items.word_wrap = True
        
        for i, item in enumerate(items):
            p_item = tf_items.add_paragraph() if i > 0 else tf_items.paragraphs[0]
            p_item.text = "• " + item
            p_item.font.name = "Arial"
            p_item.font.size = Pt(10)
            p_item.font.color.rgb = TEXT_MUTED
            p_item.space_after = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 1: Cover (Hero Title)
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1)

    tb1 = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(3.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "MIDNIGHT NETWORK ZERO-KNOWLEDGE DAPP"
    p0.font.name = "Arial"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_GREEN
    p0.space_after = Pt(10)

    p1 = tf1.add_paragraph()
    p1.text = "Midnight Privacy Payment Vault"
    p1.font.name = "Arial"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_MAIN
    p1.space_after = Pt(12)

    p2 = tf1.add_paragraph()
    p2.text = "Non-Custodial ZK Escrow, Compact Smart Contracts, ProofStation 0-Gas Balancing, and Institutional UI"
    p2.font.name = "Arial"
    p2.font.size = Pt(15)
    p2.font.color.rgb = TEXT_MUTED

    card_meta = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.9), Inches(11.3), Inches(1.5))
    card_meta.fill.solid()
    card_meta.fill.fore_color.rgb = PANEL_COLOR
    card_meta.line.color.rgb = BORDER_COLOR
    card_meta.line.width = Pt(1)

    tb_m = s1.shapes.add_textbox(Inches(1.3), Inches(5.1), Inches(10.7), Inches(1.1))
    tf_m = tb_m.text_frame
    p_m1 = tf_m.paragraphs[0]
    p_m1.text = "Core Innovation: Mathematical Zero-Knowledge Witness Auth + Zero User Gas Fees (1AM Sponsor Flow)"
    p_m1.font.name = "Arial"
    p_m1.font.size = Pt(12)
    p_m1.font.bold = True
    p_m1.font.color.rgb = ACCENT_BLUE

    p_m2 = tf_m.add_paragraph()
    p_m2.text = "Stack: Compact v0.20+ | Docker Proof Server (6300) | Midnight.js SDK | React 18 | Vite | Tailwind (Impeccable 0-Flaw)"
    p_m2.font.name = "Arial"
    p_m2.font.size = Pt(10.5)
    p_m2.font.color.rgb = TEXT_MUTED
    p_m2.space_before = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 2: Executive Summary & The Market Gap
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "Executive Summary: The Trillion-Dollar Web3 Privacy Gap")

    add_card(s2, 0.8, 1.7, 5.6, 5.2, "⚠️ The Critical Market Problem", [
        "Total Public Exposure: Ethereum & Bitcoin broadcast every transaction, balance, sender, and recipient to the world.",
        "Enterprise Adoption Blocked: Corporations cannot use public blockchains for payroll, vendor invoices, or supply chains without leaking competitive secrets.",
        "Gas-Trail De-Anonymization: Buying native gas tokens (ETH, SOL) links off-chain KYC to every subsequent on-chain interaction.",
        "Illicit Mixers vs True Compliance: Legacy privacy coins (Monero) or mixing pools face regulatory bans because they lack selective disclosure mechanisms."
    ], accent_color=ACCENT_ROSE)

    add_card(s2, 6.9, 1.7, 5.6, 5.2, "🛡️ How Midnight Vault Solves This", [
        "Dual State Architecture: Retains public verifiable accounting while keeping secrets 100% private in client memory.",
        "Zero-Knowledge Authorization: Prove ownership of contract payout rights without ever disclosing the underlying private key.",
        "Sponsored Zero-Gas Relay: ProofStation and 1AM wallet balance fees in DUST — end users pay 0 NIGHT for gas.",
        "Enterprise-Grade Compliance Ready: Selective disclosure (disclose()) architecture allows audit trails for approved parties without global leak."
    ], accent_color=ACCENT_GREEN)

    # -------------------------------------------------------------
    # SLIDE 3: Key Features Matrix
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "Key Features: What Makes Midnight Vault Exceptional")

    add_card(s3, 0.8, 1.7, 3.6, 2.5, "🔐 Non-Custodial ZK Vault", [
        "1-Click Deploy of autonomous smart contracts on Midnight Preprod.",
        "Contract owner generated via client-side cryptographic randomness.",
        "Secret witness never touches any server or network packet."
    ], accent_color=ACCENT_BLUE)

    add_card(s3, 4.85, 1.7, 3.6, 2.5, "⚡ Zero Gas (Sponsorship Flow)", [
        "Integrated with 1AM Wallet DApp Connector API.",
        "balanceUnsealedTransaction injects DUST sponsor fees automatically.",
        "Frictionless onboarding with 0 token prerequisites."
    ], accent_color=ACCENT_AMBER)

    add_card(s3, 8.9, 1.7, 3.6, 2.5, "💻 On-Device Proof Engine", [
        "Connects to Docker Proof Server on localhost:6300.",
        "Generates Groth16 / ZK-SNARK polynomial proofs in 2-4 seconds.",
        "100% cryptographic sovereignty for end users."
    ], accent_color=ACCENT_GREEN)

    add_card(s3, 0.8, 4.4, 3.6, 2.5, "📡 Patched Indexer v4", [
        "GraphQL Indexer client patched to eliminate Preprod null-offset bugs.",
        "Real-time state polling and instant UI reactive updates.",
        "Comprehensive settlement session audit log."
    ], accent_color=ACCENT_CYAN)

    add_card(s3, 4.85, 4.4, 3.6, 2.5, "🎨 Institutional Craft UI", [
        "Audited with Impeccable Design System (0 anti-patterns).",
        "Deep matte slate aesthetic (#0b0d11) with crisp structural borders.",
        "Tabular numerals (tnum) for precision financial readability."
    ], accent_color=TEXT_MAIN)

    add_card(s3, 8.9, 4.4, 3.6, 2.5, "🛡️ Domain-Separated Key", [
        "persistentHash([pad(32, 'payment:owner:v1'), sk])",
        "Prevents cross-contract signature and witness replay attacks.",
        "Cryptographic domain isolation by design."
    ], accent_color=ACCENT_ROSE)

    # -------------------------------------------------------------
    # SLIDE 4: Competitive Analysis Matrix
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "Competitive Matrix: Why Midnight Vault Wins")

    add_card(s4, 0.8, 1.7, 2.7, 5.2, "Ethereum / EVM", [
        "State Privacy: ❌ None (100% Public)",
        "Gas Cost: ❌ High ($2-$50/tx)",
        "Gas KYC Link: ❌ Permanent",
        "Compliance: ❌ Total Leak",
        "Smart Contracts: ✅ Turing Complete",
        "ZK Verification: ⚠️ Very Expensive"
    ], accent_color=ACCENT_ROSE)

    add_card(s4, 3.75, 1.7, 2.7, 5.2, "Tornado / Mixers", [
        "State Privacy: ⚠️ Obfuscation only",
        "Gas Cost: ❌ High",
        "Gas KYC Link: ❌ Public funding link",
        "Compliance: ❌ Regulatory Bans",
        "Smart Contracts: ❌ Static Pools",
        "ZK Verification: ⚠️ Basic Snarks"
    ], accent_color=ACCENT_AMBER)

    add_card(s4, 6.7, 1.7, 2.7, 5.2, "Monero (XMR)", [
        "State Privacy: ✅ Full Obfuscation",
        "Gas Cost: ✅ Low",
        "Gas KYC Link: ✅ Unlinked",
        "Compliance: ❌ Zero Auditing",
        "Smart Contracts: ❌ No Programmability",
        "ZK Verification: ⚠️ Ring Signatures"
    ], accent_color=ACCENT_CYAN)

    add_card(s4, 9.65, 1.7, 2.85, 5.2, "Midnight Vault (Ours)", [
        "State Privacy: ✅ ZK Dual-State",
        "Gas Cost: ✅ 0 (Sponsored Dust)",
        "Gas KYC Link: ✅ No Trail",
        "Compliance: ✅ Selective Disclosure",
        "Smart Contracts: ✅ Compact Language",
        "ZK Verification: ✅ Local Proof Engine"
    ], accent_color=ACCENT_GREEN, fill_color=PANEL_HIGHLIGHT)

    # -------------------------------------------------------------
    # SLIDE 5: Full-Stack Architecture & Data Flow
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "Architecture Topology: 4-Tier Distributed Pipeline")

    add_card(s5, 0.8, 1.7, 2.7, 5.2, "1. Frontend Layer", [
        "React 18 + Vite SPA",
        "1AM / Lace Connector API",
        "In-Memory Private State Store",
        "WASM Ledger runtime",
        "Interactive Progress Modal",
        "Live ProofServer Probe"
    ], accent_color=ACCENT_BLUE)

    add_card(s5, 3.75, 1.7, 2.7, 5.2, "2. Proof Engine", [
        "Docker on Port 6300",
        "midnight-proof-server",
        "Off-chain circuit evaluation",
        "ZK-SNARK generation",
        "No private keys transmitted",
        "Deterministic outputs"
    ], accent_color=ACCENT_AMBER)

    add_card(s5, 6.7, 1.7, 2.7, 5.2, "3. Sponsorship Layer", [
        "1AM Wallet Background Relay",
        "ProofStation Dust Engine",
        "balanceUnsealedTransaction",
        "Automatic fee injection",
        "Cryptographic TX signing",
        "Zero-NIGHT user expense"
    ], accent_color=ACCENT_GREEN)

    add_card(s5, 9.65, 1.7, 2.85, 5.2, "4. Midnight Node", [
        "Preprod Partnerchain",
        "AURA / GRANDPA Consensus",
        "Cardano Settlement Layer",
        "WASM Runtime Verification",
        "GraphQL Indexer v4",
        "Contract State Persistence"
    ], accent_color=ACCENT_CYAN)

    # -------------------------------------------------------------
    # SLIDE 6: Smart Contract Deep Dive (Compact Circuit Mechanics)
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "Smart Contract Deep Dive: payment.compact")

    add_card(s6, 0.8, 1.7, 5.6, 5.2, "Public Ledger Variables & Circuits", [
        "export ledger balance: Uint<128>: Current on-chain liquidity available in the vault.",
        "export ledger totalDeposited & totalWithdrawn: Cumulative accounting metrics.",
        "export circuit deposit(amount): Calls receiveUnshielded(default, disclose(amount)) to pull tNIGHT from caller.",
        "export circuit withdraw(amount, recipient): Calls sendUnshielded() to dispatch tokens to chosen address."
    ], accent_color=ACCENT_BLUE)

    add_card(s6, 6.9, 1.7, 5.6, 5.2, "Private Witnesses & Mathematical Proofs", [
        "witness ownerKey(): Bytes<32>: Local witness function executed only inside client proof engine.",
        "pure circuit deriveKey(sk): Computes persistentHash with domain tag 'payment:owner:v1'.",
        "assert(deriveKey(ownerKey()) == owner): The core ZK proof constraint — verifies authorization without revealing sk.",
        "disclose(): Explicit boundary control — guarantees private values remain unrevealed unless intended."
    ], accent_color=ACCENT_GREEN)

    # -------------------------------------------------------------
    # SLIDE 7: End-to-End Transaction Pipeline
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "Step-by-Step Transaction Execution Lifecycle")

    steps_7 = [
        ("Step 1: Parameter Assembly", "Browser constructs unproven transaction object. Validates token format (e.g. 50 tNIGHT = 50,000,000 Stars bigint).", 0.8, 1.7),
        ("Step 2: On-Device ZK Proving", "Circuits and private witness executed locally via Docker Proof Server (port 6300). Generates Groth16 proof in ~2-3s.", 6.9, 1.7),
        ("Step 3: Dust Fee Balancing", "1AM Wallet balanceUnsealedTransaction injects ProofStation sponsor fees. Zero gas cost deducted from user wallet.", 0.8, 4.4),
        ("Step 4: Block Inclusion & Indexing", "Transaction broadcast to Midnight node. Patched GraphQL Indexer polls state update and refreshes UI.", 6.9, 4.4),
    ]
    for title, desc, left, top in steps_7:
        add_card(s7, left, top, 5.6, 2.5, title, [desc])

    # -------------------------------------------------------------
    # SLIDE 8: Live Product Walkthrough & User Flow
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8)
    add_header(s8, "User Experience & Operational Flow")

    add_card(s8, 0.8, 1.7, 3.6, 5.2, "1. Connect & Deploy", [
        "Click 'Connect 1AM' — auto-detects wallet in 300ms.",
        "View live Proof Server status (green 6300 indicator).",
        "Click 'Deploy New Vault' — generates secret key and publishes contract to Preprod in ~8 seconds.",
        "Auto-saves active contract address in workspace session."
    ], accent_color=ACCENT_BLUE)

    add_card(s8, 4.85, 1.7, 3.6, 5.2, "2. Fund the Vault", [
        "Select token preset: 10, 50, 100, or custom tNIGHT.",
        "Review transparent fee preview: 0.00 NIGHT (Sponsored).",
        "Click 'Deposit NIGHT' — modal visually tracks Assembly ➔ Proving ➔ Balancing ➔ Finalization.",
        "Vault balance updates in real time."
    ], accent_color=ACCENT_AMBER)

    add_card(s8, 8.9, 1.7, 3.6, 5.2, "3. ZK Private Payout", [
        "Specify recipient address (or choose 'Self Address').",
        "Input withdrawal amount.",
        "Click 'Execute Private Payout' — Proof Server proves owner witness in ZK.",
        "Tokens transfer instantly to recipient; audit trail logs record."
    ], accent_color=ACCENT_GREEN)

    # -------------------------------------------------------------
    # SLIDE 9: Real-World Business & Enterprise Applications
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9)
    add_header(s9, "Market Applications: Beyond Simple Payments")

    add_card(s9, 0.8, 1.7, 5.6, 2.5, "🏢 Confidential Corporate Payroll", [
        "Companies deposit aggregate payroll funds into a vault.",
        "Employees claim salaries with ZK identity proofs.",
        "No competitor can see employee salary amounts or team size."
    ], accent_color=ACCENT_BLUE)

    add_card(s9, 6.9, 1.7, 5.6, 2.5, "💼 Private Supply Chain Escrow", [
        "Buyers lock supplier purchase payments in smart vaults.",
        "Funds release automatically upon off-chain Oracle milestone attestations.",
        "Protects pricing terms and trade volume confidentiality."
    ], accent_color=ACCENT_AMBER)

    add_card(s9, 0.8, 4.4, 5.6, 2.5, "🗳️ Private DAO Governance & Grants", [
        "Disburse grant funding to open-source contributors anonymously.",
        "Prevents targeted harassment or bribery of grant recipients.",
        "Public verifiable treasury balance with private payouts."
    ], accent_color=ACCENT_GREEN)

    add_card(s9, 6.9, 4.4, 5.6, 2.5, "⚖️ Regulated Institutional Settlement", [
        "Selective disclosure allows generating auditor viewing keys on demand.",
        "Satisfies SEC / MiCA compliance while shielding public surveillance.",
        "The gold standard for enterprise DeFi."
    ], accent_color=ACCENT_CYAN)

    # -------------------------------------------------------------
    # SLIDE 10: Technical Roadmap & Future Horizons
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10)
    add_header(s10, "Technical Roadmap & Scaling Horizons")

    add_card(s10, 0.8, 1.7, 3.6, 5.2, "Phase 1: Present (Complete)", [
        "✅ Compact v0.20+ contract authoring.",
        "✅ Docker Proof Server integration.",
        "✅ 1AM Wallet DApp connector.",
        "✅ Patched GraphQL Indexer client.",
        "✅ 0-Anti-Pattern Impeccable UI.",
        "✅ Full live testnet deployment."
    ], accent_color=ACCENT_GREEN)

    add_card(s10, 4.85, 1.7, 3.6, 5.2, "Phase 2: Advanced Circuits", [
        "⏳ Time-Lock Vesting (blockTimeGte).",
        "⏳ Multi-Signer Threshold Approval.",
        "⏳ Shielded ZSwap Token Transfer integration.",
        "⏳ Whitelist Merkle Tree membership proofs.",
        "⏳ Multi-Token Native Fungible support."
    ], accent_color=ACCENT_AMBER)

    add_card(s10, 8.9, 1.7, 3.6, 5.2, "Phase 3: Production Mainnet", [
        "🔮 Midnight Mainnet readiness.",
        "🔮 Mobile SDK & Android Passkey proving.",
        "🔮 Hardware wallet (Ledger) ZK signing.",
        "🔮 SDK Package publish to NPM.",
        "🔮 Institutional Auditor viewing keys."
    ], accent_color=ACCENT_CYAN)

    # -------------------------------------------------------------
    # SLIDE 11: Summary & Conclusion
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11)
    add_header(s11, "Summary: Why Midnight Vault Wins 1st Place")

    add_card(s11, 0.8, 1.7, 11.733, 5.2, "🏆 The Winning Edge", [
        "1. Complete End-to-End Implementation: Not a mock or prototype — a fully compiling, provable, and functional DApp on Midnight Preprod.",
        "2. Frictionless User Experience: Sponsoring gas fees via 1AM ProofStation creates an experience indistinguishable from Web2 speed.",
        "3. Cryptographic Privacy by Design: Private witness architecture ensures secrets never leave user memory.",
        "4. Institutional Craft Floor UI: Clean, data-dense, matte dark aesthetic built with zero AI slop or generic tropes.",
        "5. Scalable Foundation: Ready for corporate payroll, escrow, DAO grants, and enterprise settlement."
    ], accent_color=ACCENT_GREEN, fill_color=PANEL_HIGHLIGHT)

    prs.save(output_path)
    print(f"[SUCCESS] Top-Tier Pitch Deck saved to: {output_path}")

if __name__ == "__main__":
    out = "Midnight_Privacy_Payment_Vault_Presentation.pptx"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    create_top_tier_presentation(out)

import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        if self._pageNumber > 1:
            # Header
            self.drawString(54, 11 * inch - 36, "Midnight Privacy Payment Vault — User Manual & Architecture Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

            # Footer
            self.drawString(54, 36, "Official Midnight Network DApp Reference Documentation")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 36, page_text)
            self.line(54, 46, 8.5 * inch - 54, 46)

        self.restoreState()

def build_pdf(filename="Midnight_Vault_User_Manual_and_Architecture_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Palette
    C_PRIMARY = colors.HexColor("#0f172a") # Slate 900
    C_ACCENT = colors.HexColor("#2563eb")  # Blue 600
    C_EMERALD = colors.HexColor("#059669") # Emerald 600
    C_TEXT = colors.HexColor("#1e293b")    # Slate 800
    C_MUTED = colors.HexColor("#475569")   # Slate 600
    C_BG_CARD = colors.HexColor("#f8fafc") # Card BG
    C_BORDER = colors.HexColor("#cbd5e1")  # Border
    C_CODE_BG = colors.HexColor("#f1f5f9") # Code BG

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=C_PRIMARY,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11.5,
        leading=15,
        textColor=C_MUTED,
        spaceAfter=18
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=C_ACCENT,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=C_PRIMARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e3a8a")
    )

    story = []

    def add_callout(text, bg_color=colors.HexColor("#eff6ff"), border_color=colors.HexColor("#93c5fd")):
        p = Paragraph(text, callout_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(Spacer(1, 4))
        story.append(t)
        story.append(Spacer(1, 6))

    def add_code(code_text):
        clean_code = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>').replace(' ', '&nbsp;')
        p = Paragraph(clean_code, code_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_CODE_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(Spacer(1, 4))
        story.append(t)
        story.append(Spacer(1, 6))

    # ================= COVER =================
    story.append(Spacer(1, 6))
    story.append(Paragraph("MIDNIGHT PRIVACY PAYMENT VAULT", title_style))
    story.append(Paragraph("Comprehensive User Manual, Operational Guide, and Architecture Reference", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceBefore=0, spaceAfter=12))

    meta_data = [
        [Paragraph("<b>Application:</b> Midnight Privacy Payment Vault", body_style), Paragraph("<b>Version:</b> 1.0.0 (Preprod Production Build)", body_style)],
        [Paragraph("<b>Smart Contract:</b> Compact v0.20+ (payment.compact)", body_style), Paragraph("<b>Zero-Knowledge Engine:</b> Docker Local Port 6300", body_style)],
        [Paragraph("<b>Fee Model:</b> Sponsored DUST (0 User Gas Fees)", body_style), Paragraph("<b>Frontend:</b> React 18 + Vite 6 + Tailwind CSS", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[252, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ================= SECTION 1 =================
    story.append(Paragraph("1. What is this Application?", h1_style))
    story.append(Paragraph(
        "The <b>Midnight Privacy Payment Vault</b> is a decentralized, non-custodial smart contract application built on the Midnight blockchain. It allows users to securely deposit tokens into an autonomous vault and authorize private withdrawals using <b>Zero-Knowledge (ZK) Proofs</b>.",
        body_style
    ))
    story.append(Paragraph(
        "On traditional blockchains (like Ethereum), executing an owner-authorized payout requires revealing your private address or signing transactions that expose your identity. On Midnight, the vault contract stores only a cryptographic commitment (hash). When you withdraw funds, your computer generates a mathematical proof demonstrating: <i>'I possess the valid owner secret key for this vault'</i> without ever transmitting or revealing the secret key to the blockchain, the network, or the public.",
        body_style
    ))
    add_callout("<b>Key Benefit:</b> Complete commercial confidentiality, zero gas fees for end users via 1AM sponsor relays, and instantaneous verification by Midnight consensus validators.")

    # ================= SECTION 2 =================
    story.append(Paragraph("2. Step-by-Step User Manual: How to Use This App", h1_style))
    story.append(Paragraph(
        "Follow these steps to deploy, fund, and interact with your privacy payment vault:",
        body_style
    ))

    story.append(Paragraph("Step 1: Start the Development Server & Verify Proof Engine", h2_style))
    story.append(Paragraph("Ensure Docker is running on your machine, then launch the web application:", body_style))
    add_code("cd \"d:\\codeverse\\workshop stuffs\"\nnpm run dev")
    story.append(Paragraph("Open your web browser to <b>http://localhost:5173/</b>. Observe the top navigation bar: you should see a green badge indicating <b>'Proof Engine: Active (6300)'</b>.", body_style))

    story.append(Paragraph("Step 2: Connect Your Midnight Wallet", h2_style))
    story.append(Paragraph("• Click the <b>'Connect 1AM'</b> button in the top right corner of the dashboard.", bullet_style))
    story.append(Paragraph("• Approve the connection modal in the 1AM Browser Extension.", bullet_style))
    story.append(Paragraph("• Your unshielded address (e.g. <code>mn_addr_preprod1...</code>) and network badge (<code>Preprod</code>) will appear in the navigation bar.", bullet_style))

    story.append(Paragraph("Step 3: Deploy a New Privacy Vault", h2_style))
    story.append(Paragraph("• Under the <b>'Deploy New Vault Contract'</b> card, click <b>'Deploy New Vault'</b>.", bullet_style))
    story.append(Paragraph("• The browser generates a 32-byte cryptographic secret key (<code>ownerSecretKey</code>) in local memory.", bullet_style))
    story.append(Paragraph("• Your local Proof Server builds the Zero-Knowledge deployment proof off-chain in 2–4 seconds.", bullet_style))
    story.append(Paragraph("• The 1AM wallet sponsors the dust transaction fee (0.00 NIGHT cost).", bullet_style))
    story.append(Paragraph("• Once committed by the network, the newly generated <b>Vault Contract Address</b> is automatically activated.", bullet_style))

    story.append(Paragraph("Step 4: Deposit Tokens into the Vault", h2_style))
    story.append(Paragraph("• In the <b>'Deposit Liquidity'</b> card, select a preset (10, 50, 100 tNIGHT) or enter a custom amount.", bullet_style))
    story.append(Paragraph("• Click <b>'Deposit NIGHT'</b>.", bullet_style))
    story.append(Paragraph("• The live transaction tracker modal opens, displaying the 4-phase execution: <i>Assembly ➔ Proving ➔ Balancing ➔ Finalization</i>.", bullet_style))
    story.append(Paragraph("• Upon block inclusion, the vault's on-chain balance and total inflow metrics update automatically.", bullet_style))

    story.append(Paragraph("Step 5: Execute a Zero-Knowledge Private Payout (Withdraw)", h2_style))
    story.append(Paragraph("• In the <b>'Execute Private Payout'</b> card, enter the payout recipient address (or click 'Self Address').", bullet_style))
    story.append(Paragraph("• Enter the withdrawal amount in tNIGHT.", bullet_style))
    story.append(Paragraph("• Click <b>'Execute Private Payout'</b>.", bullet_style))
    story.append(Paragraph("• The local Proof Server proves that your browser holds the secret owner key matching the on-chain commitment.", bullet_style))
    story.append(Paragraph("• The contract dispatches the requested tokens directly to the recipient address.", bullet_style))

    # ================= SECTION 3 =================
    story.append(Paragraph("3. 'What is Used for What?' — Exhaustive Architecture Breakdown", h1_style))
    story.append(Paragraph(
        "Here is the exact purpose and function of every file, tool, and service in this project:",
        body_style
    ))

    # File Table
    file_rows = [
        [Paragraph("<b>File / Component</b>", body_style), Paragraph("<b>What is it used for?</b>", body_style)],
        [Paragraph("<code>contract/src/payment.compact</code>", body_style), Paragraph("The smart contract source code written in Compact. Defines public variables (<code>balance</code>, <code>owner</code>), private witness (<code>ownerKey</code>), and circuits (<code>deposit</code>, <code>withdraw</code>).", body_style)],
        [Paragraph("<code>contract/src/managed/payment/</code>", body_style), Paragraph("Auto-generated compiled artifacts from Compact compiler: TypeScript contract interfaces, ZKIR (Zero-Knowledge Intermediate Representation), and cryptographic proving keys.", body_style)],
        [Paragraph("<code>public/zk/payment/</code>", body_style), Paragraph("Static proving (<code>.prover</code>) and verification (<code>.verifier</code>) keys served via HTTP to the browser for ZK-SNARK computation.", body_style)],
        [Paragraph("<code>src/lib/midnight.ts</code>", body_style), Paragraph("Core Midnight infrastructure module: detects 1AM/Lace wallet, initializes in-memory private state stores, and provides the patched GraphQL Indexer client (fixes the Preprod null-offset bug).", body_style)],
        [Paragraph("<code>src/lib/payment.ts</code>", body_style), Paragraph("Application contract interface: low-level contract deployment (<code>createUnprovenDeployTx</code>), circuit execution (<code>createUnprovenCallTx</code>), and state decoders.", body_style)],
        [Paragraph("<code>src/lib/object-inspect-fix.mjs</code>", body_style), Paragraph("ESM shim providing a default export for the CommonJS <code>object-inspect</code> package required by <code>@midnight-ntwrk/compact-runtime</code>.", body_style)],
        [Paragraph("<code>src/lib/isomorphic-ws-fix.mjs</code>", body_style), Paragraph("Browser WebSocket shim mapping <code>isomorphic-ws</code> to native browser <code>globalThis.WebSocket</code>.", body_style)],
        [Paragraph("<code>src/contexts/WalletContext.tsx</code>", body_style), Paragraph("React context managing wallet connection state, address formatting, and session persistence.", body_style)],
        [Paragraph("<code>src/components/VaultMetrics.tsx</code>", body_style), Paragraph("Real-time telemetry dashboard displaying on-chain vault balance, total deposits, and total payouts.", body_style)],
        [Paragraph("<code>src/components/ContractDeployer.tsx</code>", body_style), Paragraph("Component handling 1-click contract deployment and loading existing vault addresses.", body_style)],
        [Paragraph("<code>src/components/TransactionStatusModal.tsx</code>", body_style), Paragraph("Interactive modal tracker visualizing the 4-phase transaction execution pipeline.", body_style)],
        [Paragraph("<code>scripts/sync-assets.mjs</code>", body_style), Paragraph("Node.js build script copying compiled ZK proving keys from the contract folder to the public web server directory.", body_style)],
        [Paragraph("<code>vite.config.ts</code>", body_style), Paragraph("Bundler configuration enabling WebAssembly (WASM), top-level await, module aliases, and ESNext target compilation.", body_style)]
    ]
    file_table = Table(file_rows, colWidths=[150, 354])
    file_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (-1,-1), C_BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(file_table)
    story.append(Spacer(1, 10))

    # ================= SECTION 4 =================
    story.append(Paragraph("4. External Tools & Services Decoded", h1_style))

    tool_data = [
        [Paragraph("<b>External Service / Tool</b>", body_style), Paragraph("<b>Why is it needed and what does it do?</b>", body_style)],
        [Paragraph("<b>WSL 2 (Ubuntu Linux)</b>", body_style), Paragraph("Runs a native Linux kernel on Windows. Midnight's <code>compact</code> smart contract compiler is built for Linux. Antigravity uses WSL to execute compiler commands smoothly.", body_style)],
        [Paragraph("<b>Docker Proof Server (port 6300)</b>", body_style), Paragraph("A containerized daemon (<code>midnightntwrk/proof-server:latest</code>) running locally. It generates Groth16 ZK-SNARK polynomial proofs on-device so secret keys are never transmitted over the internet.", body_style)],
        [Paragraph("<b>1AM Wallet Extension</b>", body_style), Paragraph("The browser extension that holds user accounts and interacts with ProofStation to sponsor DUST fees, enabling 0 gas fees for users.", body_style)],
        [Paragraph("<b>Midnight GraphQL Indexer v4</b>", body_style), Paragraph("A cloud service provided by Midnight that reads Substrate ledger blocks and allows the frontend to query contract state and transaction history in real time.", body_style)]
    ]
    tool_table = Table(tool_data, colWidths=[150, 354])
    tool_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (-1,-1), C_BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tool_table)
    story.append(Spacer(1, 10))

    # ================= SECTION 5 =================
    story.append(Paragraph("5. Troubleshooting & Frequently Asked Questions", h1_style))
    story.append(Paragraph("• <b>'Proof Engine: Unreachable' in Navbar:</b> Make sure Docker Desktop is open and the container on port 6300 is running (<code>docker run -d -p 6300:6300 midnightntwrk/proof-server:latest</code>).", bullet_style))
    story.append(Paragraph("• <b>White Screen or Blank Page in Browser:</b> Press <code>Ctrl + Shift + R</code> in Chrome to clear stale caches and reload WebAssembly modules.", bullet_style))
    story.append(Paragraph("• <b>'Version mismatch: compiled code expects 0.16.0':</b> Resolved by ensuring <code>@midnight-ntwrk/compact-runtime@0.16.0</code> is installed.", bullet_style))
    story.append(Paragraph("• <b>Transaction taking ~8–12 seconds:</b> This is normal on Preprod testnet. Step 1: Assembly (0.5s) ➔ Step 2: ZK Proving (3s) ➔ Step 3: Fee Balancing (2s) ➔ Step 4: Block Finality (4–6s).", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] User manual generated: {filename}")

if __name__ == "__main__":
    out = "Midnight_Vault_User_Manual_and_Architecture_Guide.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    build_pdf(out)

import os
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

        # Do not draw on cover page (page 1)
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 11 * inch - 36, "KNIGHT.VAULT // Midnight Network & ZK-DApp Engineering Guidebook")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

            # Footer
            self.drawString(54, 36, "Confidential & Educational — KNIGHT.VAULT Engineering Reference")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 36, page_text)
            self.line(54, 46, 8.5 * inch - 54, 46)

        self.restoreState()

def build_pdf(filename="Midnight_Blockchain_and_DApp_Guidebook.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    C_PRIMARY = colors.HexColor("#0f172a") # Dark Slate
    C_ACCENT = colors.HexColor("#0284c7")  # Cyan / Blue
    C_MINT = colors.HexColor("#059669")    # Mint
    C_INDIGO = colors.HexColor("#4f46e5")  # Indigo
    C_TEXT = colors.HexColor("#1e293b")    # Dark Body
    C_MUTED = colors.HexColor("#475569")   # Muted Body
    C_BG_CARD = colors.HexColor("#f8fafc") # Card background
    C_BORDER = colors.HexColor("#cbd5e1")  # Light Border
    C_CODE_BG = colors.HexColor("#f1f5f9") # Code block bg

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=29,
        textColor=C_PRIMARY,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11.5,
        leading=16,
        textColor=C_MUTED,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=C_PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=C_INDIGO,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
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
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
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
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(Spacer(1, 4))
        story.append(t)
        story.append(Spacer(1, 6))

    # ================= COVER / TITLE =================
    story.append(Spacer(1, 10))
    story.append(Paragraph("THE COMPLETE GUIDEBOOK TO ZERO-KNOWLEDGE BLOCKCHAIN & DAPP ENGINEERING", title_style))
    story.append(Paragraph("From Distributed Systems First Principles to Production Deployment on Midnight Network with WSL2, Ubuntu, Docker & Midnight Lace Wallet", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceBefore=0, spaceAfter=14))

    # Metadata Card
    meta_data = [
        [Paragraph("<b>Project:</b> KNIGHT.VAULT Protocol", body_style), Paragraph("<b>Network:</b> Midnight Blockchain (Preprod / Preview)", body_style)],
        [Paragraph("<b>Smart Contracts:</b> Compact Circuits", body_style), Paragraph("<b>ZK Prover:</b> Local Docker ProofServer (:6300) / Railway", body_style)],
        [Paragraph("<b>Wallet System:</b> Midnight Lace DApp Connector (0 Gas)", body_style), Paragraph("<b>Architect:</b> Kshitij Adakane (Systems Builder)", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[252, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ================= CHAPTER 1: FIRST PRINCIPLES =================
    story.append(Paragraph("Chapter 1: The First Principles of Computing & Blockchains", h1_style))
    story.append(Paragraph(
        "To understand what a decentralized application (DApp) is, we must first break down the concept of a <b>ledger</b> from its most elementary mathematical roots.",
        body_style
    ))
    
    story.append(Paragraph("1.1 What is a Ledger?", h2_style))
    story.append(Paragraph(
        "At its core, a ledger is an append-only chronological record of facts and balance transitions. Historically, ledgers were centralized: a trusted entity (bank, registry, or database administrator) held the master copy. If the central authority fails, gets censored, or makes an error, the entire system state becomes corrupt.",
        body_style
    ))

    story.append(Paragraph("1.2 What is a Blockchain?", h2_style))
    story.append(Paragraph(
        "A blockchain is a <b>decentralized, cryptographically-secured distributed ledger</b> maintained by a peer-to-peer (P2P) network of independent nodes without requiring a central coordinator.",
        body_style
    ))
    story.append(Paragraph("• <b>Blocks:</b> Batches of valid transactions bundled with timestamp, nonce, and root hashes.", bullet_style))
    story.append(Paragraph("• <b>Cryptographic Hash Linking:</b> Every block contains the hash of the preceding block header, making state immutable.", bullet_style))
    story.append(Paragraph("• <b>Consensus:</b> Algorithms (AURA, GRANDPA, PoS) enabling global agreement on the valid state order.", bullet_style))
    story.append(Paragraph("• <b>Smart Contracts:</b> Deterministic state machine programs that run autonomously on-chain.", bullet_style))

    # ================= CHAPTER 2: ENVIRONMENT & REAL-WORLD INSTALLATION =================
    story.append(Paragraph("Chapter 2: Production Development Environment Setup (WSL2, Docker & Tools)", h1_style))
    story.append(Paragraph(
        "Building on Midnight Network requires compiling Compact smart contracts, running local Zero-Knowledge proving engines, and orchestrating client SDKs. Below are the precise steps and real-world hurdles encountered when configuring developer workstations.",
        body_style
    ))

    story.append(Paragraph("2.1 Windows Subsystem for Linux (WSL2) & Ubuntu Setup", h2_style))
    story.append(Paragraph(
        "Because the Compact compiler toolchain and cryptographic ZK-SNARK provers are native Linux binaries, Windows developers must execute their build environments inside <b>WSL2 (Ubuntu 22.04 LTS or 24.04 LTS)</b>.",
        body_style
    ))
    story.append(Paragraph("1. Open Windows PowerShell as Administrator and enable WSL2:", body_style))
    add_code("wsl --install -d Ubuntu-22.04\nwsl --set-default-version 2")
    story.append(Paragraph("2. <b>Crucial Memory Tuning (.wslconfig):</b> ZK-SNARK circuit proving requires substantial memory. Create or edit <code>C:\\Users\\&lt;YourUser&gt;\\.wslconfig</code> to allocate adequate RAM to prevent Out-Of-Memory (OOM) crashes:", body_style))
    add_code("[wsl2]\nmemory=12GB\nswap=4GB\nlocalhostForwarding=true")
    story.append(Paragraph("3. Inside Ubuntu, install essential system build dependencies:", body_style))
    add_code("sudo apt update && sudo apt install -y curl git build-essential pkg-config libssl-dev")

    story.append(Paragraph("2.2 Docker Desktop & ProofStation Container Setup", h2_style))
    story.append(Paragraph(
        "The Midnight ProofServer is responsible for compiling Halo2 / Plonk zero-knowledge circuits into mathematical proof transcripts on port <b>6300</b>.",
        body_style
    ))
    story.append(Paragraph("• <b>WSL Integration:</b> Open Docker Desktop &rarr; <i>Settings</i> &rarr; <i>Resources</i> &rarr; <i>WSL Integration</i> &rarr; enable <b>Ubuntu-22.04</b>.", bullet_style))
    story.append(Paragraph("• <b>Starting the ProofServer:</b> Run the official Midnight ProofServer container:", bullet_style))
    add_code("docker run -d --name proof-server -p 6300:6300 midnightnetwork/proof-server:latest")
    story.append(Paragraph("• <b>Verify Container Health:</b> Confirm the server is responding on localhost:", bullet_style))
    add_code("curl http://localhost:6300/health\n# Response: {\"status\":\"ok\",\"service\":\"proof-server\"}")

    add_callout("<b>Troubleshooting Port 6300:</b> If Docker reports 'port already in use', find the conflicting process with <code>netstat -ano | findstr :6300</code> or kill dangling proof containers with <code>docker rm -f proof-server</code>.", bg_color=colors.HexColor("#fffbeb"), border_color=colors.HexColor("#fcd34d"))

    # ================= CHAPTER 3: MIDNIGHT LACE WALLET & DUST RELAY =================
    story.append(Paragraph("Chapter 3: Midnight Lace Wallet Integration & Sponsored Dust Architecture", h1_style))
    story.append(Paragraph(
        "Midnight Network introduces a dual-token paradigm: <b>tNIGHT</b> (unshielded/shielded settlement currency) and <b>DUST</b> (non-transferable computational resource used for gas fees).",
        body_style
    ))

    story.append(Paragraph("3.1 Midnight Lace Browser Wallet Configuration", h2_style))
    story.append(Paragraph("1. Install the <b>Midnight Lace Wallet Extension</b> from the Midnight Developer Portal into Google Chrome, Brave, or Edge.", bullet_style))
    story.append(Paragraph("2. Switch the active network to <b>Midnight Preprod</b> with the official GraphQL indexer URL: <code>https://indexer.preprod.midnight.network/api/v4/graphql</code>.", bullet_style))
    story.append(Paragraph("3. Fund your address via the <b>Midnight Testnet Faucet</b> to receive initial tNIGHT.", bullet_style))
    story.append(Paragraph("4. <b>Handshake Authorization:</b> In TypeScript, the frontend connects to Lace using:", bullet_style))
    add_code("const midnightApi = window.midnight?.mnLace;\nif (!midnightApi) throw new Error('Midnight Lace wallet not detected');\nconst wallet = await midnightApi.enable();\nconst state = await wallet.state();")

    story.append(Paragraph("3.2 Zero-Gas Dust Balancing Flow", h2_style))
    story.append(Paragraph(
        "Traditional blockchains require every payer to hold gas tokens. In <b>KNIGHT.VAULT</b>, transactions are balanced via <code>balanceUnsealedTransaction</code> through Lace's ProofStation relay, allowing users to interact with <b>0.00 NIGHT user gas</b>.",
        body_style
    ))

    # ================= CHAPTER 4: SMART CONTRACT ARCHITECTURE =================
    story.append(Paragraph("Chapter 4: Compact Smart Contract Design & ZK Proofs", h1_style))
    story.append(Paragraph(
        "The smart contract is written in <b>Compact</b>, Midnight's domain-specific language for zero-knowledge smart contracts.",
        body_style
    ))

    add_code("""// payment.compact (Midnight stdlib)
contract PaymentVault {
  ledger balance: Counter;
  ledger totalDeposited: Counter;
  ledger ownerCommitment: Bytes<32>;

  // Public Payer Inflow (Zero-Gas)
  export circuit receiveUnshielded(amount: Uint<64>): Void {
    balance.increment(amount);
    totalDeposited.increment(amount);
  }

  // Confidential Withdrawal (ZK Owner Auth)
  export circuit withdraw(
    amount: Uint<64>, 
    recipient: Either<ZswapCoinPublicKey, ContractAddress>
  ): Void {
    witness ownerSecretKey: Bytes<32>;
    assert persistentCommit(ownerSecretKey) == ownerCommitment;
    balance.decrement(amount);
    sendUnshielded(amount, recipient);
  }
}""")

    story.append(Paragraph("4.1 How Privacy is Enforced Cryptographically", h2_style))
    story.append(Paragraph("• <b>Private Witness (<code>witness ownerSecretKey</code>):</b> The secret key is evaluated strictly inside local browser memory. It is never broadcast over RPC or committed to the ledger.", bullet_style))
    story.append(Paragraph("• <b>Zero-Knowledge Commitment (<code>persistentCommit</code>):</b> The contract asserts that the private witness produces the published owner commitment without revealing the preimage.", bullet_style))
    story.append(Paragraph("• <b>Deterministic Ledger Counter:</b> The public vault balance increments and decrements transparently, while the withdrawer's identity remains completely shielded.", bullet_style))

    # ================= CHAPTER 5: SUMMARY =================
    story.append(Paragraph("Chapter 5: Production Summary & Architect Credits", h1_style))
    story.append(Paragraph(
        "<b>KNIGHT.VAULT</b> represents an end-to-end realization of institutional privacy. By combining WSL2, Docker ProofServer, Compact Circuits, and the Midnight Lace Wallet, developers can build scalable, privacy-first DeFi applications.",
        body_style
    ))

    add_callout("<b>Architect:</b> Kshitij Adakane &bull; <i>Vibe Coder, Systems Builder & Applied AI/ML</i><br/><b>GitHub:</b> https://github.com/KSHITIJadakane/KNIGHT.VAULT", bg_color=colors.HexColor("#f0fdf4"), border_color=colors.HexColor("#86efac"))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF generated: {filename}")

if __name__ == "__main__":
    out = "Midnight_Blockchain_and_DApp_Guidebook.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    build_pdf(out)

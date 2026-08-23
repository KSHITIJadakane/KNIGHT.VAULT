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
            self.drawString(54, 11 * inch - 36, "Midnight Network & Privacy DApp Engineering Guidebook")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

            # Footer
            self.drawString(54, 36, "Confidential & Educational — Midnight Network Workshop Handbook")
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
    C_ACCENT = colors.HexColor("#2563eb")  # Blue
    C_EMERALD = colors.HexColor("#059669") # Emerald
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
        fontSize=24,
        leading=30,
        textColor=C_PRIMARY,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=C_MUTED,
        spaceAfter=24
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=C_ACCENT,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=C_PRIMARY,
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
    story.append(Paragraph("THE COMPLETE GUIDEBOOK TO BLOCKCHAIN & ZERO-KNOWLEDGE DAPP ENGINEERING", title_style))
    story.append(Paragraph("From First Principles of Distributed Systems to Deploying Privacy-Preserving Smart Contracts on Midnight Network", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceBefore=0, spaceAfter=14))

    # Metadata Card
    meta_data = [
        [Paragraph("<b>Target Audience:</b> Developers & Workshop Engineers", body_style), Paragraph("<b>Network:</b> Midnight Blockchain (Preprod / Preview)", body_style)],
        [Paragraph("<b>Authoring Language:</b> Compact (v0.20+)", body_style), Paragraph("<b>Proof Engine:</b> ZK-SNARK Local ProofServer (Port 6300)", body_style)],
        [Paragraph("<b>Wallet System:</b> 1AM DApp Connector (0 Gas)", body_style), Paragraph("<b>Frontend:</b> React 18 + Vite + TypeScript", body_style)]
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

    # ================= CHAPTER 1 =================
    story.append(Paragraph("Chapter 1: The First Principles of Computing & Blockchains", h1_style))
    story.append(Paragraph(
        "To understand what a decentralized application (DApp) is, we must first break down the concept of a <b>ledger</b> from its most elementary mathematical roots.",
        body_style
    ))
    
    story.append(Paragraph("1.1 What is a Ledger?", h2_style))
    story.append(Paragraph(
        "At its core, a ledger is simply an append-only chronological record of facts and balance transitions. Throughout human history, ledgers were centralized: a single trusted entity (such as a bank, a government agency, or a database administrator) controlled the master record. If Alice sent $10 to Bob, the bank decreased Alice's balance and increased Bob's balance.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The Single Point of Failure:</b> If the centralized authority is compromised, censored, or makes a computational mistake, the entire state of the system becomes corrupted. Furthermore, participants must place unconditional trust in that single intermediary.",
        body_style
    ))

    story.append(Paragraph("1.2 What is a Blockchain?", h2_style))
    story.append(Paragraph(
        "A blockchain is a <b>decentralized, cryptographically-secured distributed ledger</b> maintained by a peer-to-peer (P2P) network of independent nodes without requiring a central coordinator.",
        body_style
    ))
    story.append(Paragraph("The key mechanics of a blockchain include:", body_style))
    story.append(Paragraph("• <b>Blocks:</b> Batches of valid transactions bundled together with metadata (timestamp, nonce, block height).", bullet_style))
    story.append(Paragraph("• <b>Cryptographic Hash Linking:</b> Every block contains a mathematical hash of the immediately preceding block header. If any transaction in a past block is altered by even one bit, the hash of that block changes entirely, breaking the cryptographic chain forward.", bullet_style))
    story.append(Paragraph("• <b>Consensus Mechanisms:</b> Algorithms (such as AURA, GRANDPA, Proof of Stake, or Proof of Work) that allow distributed nodes across the globe to agree on the exact order and validity of state transitions.", bullet_style))
    story.append(Paragraph("• <b>Smart Contracts:</b> Deterministic state machines that live on the blockchain and automatically execute predefined rules when triggered by transactions.", bullet_style))

    story.append(Paragraph("1.3 The Fundamental Flaw of Traditional Blockchains: Total Exposure", h2_style))
    story.append(Paragraph(
        "In traditional blockchains like Bitcoin and Ethereum, <b>all data is 100% public</b>. Every validator must see every account balance, every transaction sender, every recipient, and all contract input arguments to verify that a transaction is valid.",
        body_style
    ))
    add_callout("<b>The Transparency Paradox:</b> While total transparency prevents fraud, it completely destroys commercial and personal confidentiality. Businesses cannot put payroll, supply chain bids, trade secrets, or healthcare records on public blockchains because competitors and observers can inspect all data.")

    # ================= CHAPTER 2 =================
    story.append(Paragraph("Chapter 2: Zero-Knowledge Cryptography (ZK-SNARKs)", h1_style))
    story.append(Paragraph(
        "Zero-Knowledge cryptography fundamentally resolves the transparency paradox. It enables a <b>Prover</b> to prove to a <b>Verifier</b> that a statement is mathematically true, without revealing any secret information beyond the validity of the statement itself.",
        body_style
    ))

    story.append(Paragraph("2.1 The Classic Intuition: The Cave Analogy", h2_style))
    story.append(Paragraph(
        "Imagine a circular cave with a locked secret door in the middle. Alice knows the secret passcode to unlock the door. Bob wants proof that Alice knows the passcode, but Alice does not want to tell Bob the passcode.",
        body_style
    ))
    story.append(Paragraph(
        "Bob stands outside the cave entrance. Alice walks down Path A or Path B. Bob then calls out: <i>'Alice, come out via Path B!'</i> If Alice knows the passcode, she can always unlock the door and emerge from Path B, regardless of which path she entered. If she repeats this test 40 times in a row, the probability of her guessing without the passcode is 1 in 2^40 (less than one in a trillion). Bob is 100% convinced Alice knows the secret, yet Bob learned nothing about the passcode itself.",
        body_style
    ))

    story.append(Paragraph("2.2 What are ZK-SNARKs?", h2_style))
    story.append(Paragraph(
        "ZK-SNARK stands for <b>Zero-Knowledge Succinct Non-Interactive Argument of Knowledge</b>:",
        body_style
    ))
    story.append(Paragraph("• <b>Zero-Knowledge:</b> No private inputs are revealed.", bullet_style))
    story.append(Paragraph("• <b>Succinct:</b> The proof is small (often a few hundred bytes) and can be verified in milliseconds, regardless of how complex the underlying computation was.", bullet_style))
    story.append(Paragraph("• <b>Non-Interactive:</b> The prover generates the proof once; any verifier on earth can verify it without ongoing communication.", bullet_style))
    story.append(Paragraph("• <b>Argument of Knowledge:</b> It is computationally impossible for someone to construct a valid proof unless they genuinely possess the secret witness.", bullet_style))

    # ================= CHAPTER 3 =================
    story.append(Paragraph("Chapter 3: The Midnight Network Architecture", h1_style))
    story.append(Paragraph(
        "Midnight is a next-generation privacy-first blockchain developed by Input Output Global (IOG) within the Cardano ecosystem. It is specifically designed to reconcile <b>data privacy</b> with <b>regulatory compliance</b> and <b>computational integrity</b>.",
        body_style
    ))

    story.append(Paragraph("3.1 The Dual State Model", h2_style))
    story.append(Paragraph(
        "Unlike Ethereum where all state is unified and public, Midnight introduces a revolutionary dual-state model:",
        body_style
    ))
    story.append(Paragraph("• <b>1. Public Ledger State:</b> Shared global variables stored on-chain that all network participants agree on (e.g., total vault balance, contract addresses, token total supply).", bullet_style))
    story.append(Paragraph("• <b>2. Private State (Witnesses):</b> Secret data stored exclusively on the user's local machine (e.g., private spending keys, secret identities, unrevealed bids, credit scores).", bullet_style))
    story.append(Paragraph("• <b>3. ZK Circuits:</b> Mathematical constraints written in Compact that run off-chain inside the user's proof engine, transforming private states into cryptographically verified public state transitions.", bullet_style))

    story.append(Paragraph("3.2 The Cardano Partnerchain Model & Consensus", h2_style))
    story.append(Paragraph(
        "Midnight operates as a high-throughput Substrate-based partnerchain anchored to the Cardano ecosystem. It uses <b>AURA</b> for rapid block production and <b>GRANDPA</b> for deterministic finality, securing privacy-enabled smart contract execution with enterprise-grade finality guarantees.",
        body_style
    ))

    story.append(Paragraph("3.3 Fee Sponsorship & Dust Economics (Zero Gas)", h2_style))
    story.append(Paragraph(
        "On traditional networks, users must hold native gas tokens (like ETH) in their public wallet to pay for transactions, which exposes their identity through gas fee funding trails. Midnight solves this via <b>DUST</b> fees and sponsor relays (ProofStation). The 1AM wallet balances transactions by adding dust sponsorship, allowing end-users to interact with DApps with <b>zero gas cost</b>.",
        body_style
    ))

    # ================= CHAPTER 4 =================
    story.append(Paragraph("Chapter 4: The Developer Toolchain Explained in Detail", h1_style))
    story.append(Paragraph(
        "Why did the workshop require specific tools like WSL 2, Ubuntu, Docker, and 1AM Wallet? Here is the exact role of every tool:",
        body_style
    ))

    # Tool Table
    tool_rows = [
        [Paragraph("<b>Tool / Component</b>", body_style), Paragraph("<b>Exact Function & Purpose</b>", body_style)],
        [Paragraph("<b>WSL 2 & Ubuntu</b>", body_style), Paragraph("Windows Subsystem for Linux provides a native Linux kernel inside Windows. The Midnight <code>compact</code> smart contract compiler is compiled for Linux environments.", body_style)],
        [Paragraph("<b>Compact CLI</b>", body_style), Paragraph("Compiles <code>.compact</code> smart contracts into TypeScript bindings, cryptographic verification keys (<code>.verifier</code>), proving keys (<code>.prover</code>), and ZKIR.", body_style)],
        [Paragraph("<b>Docker Proof Server</b><br/>(port 6300)", body_style), Paragraph("A containerized mathematical engine (<code>midnightntwrk/proof-server:latest</code>) running locally on your computer. It performs the heavy polynomial arithmetic to build ZK proofs on-device.", body_style)],
        [Paragraph("<b>1AM Wallet Extension</b>", body_style), Paragraph("Browser extension (<code>window.midnight['1am']</code>) that manages cryptographic keys, signs transactions, and communicates with ProofStation for fee sponsorship.", body_style)],
        [Paragraph("<b>Midnight Indexer v4</b>", body_style), Paragraph("A GraphQL service provided by Midnight that reads raw Substrate blocks and exposes clean querying endpoints for contract states and transaction actions.", body_style)],
        [Paragraph("<b>Vite + React + TS</b>", body_style), Paragraph("The modern frontend layer configured with WebAssembly (WASM) and top-level await to run Midnight cryptographic libraries in the browser.", body_style)]
    ]
    tool_table = Table(tool_rows, colWidths=[140, 364])
    tool_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (-1,-1), C_BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tool_table)
    story.append(Spacer(1, 12))

    # ================= CHAPTER 5 =================
    story.append(Paragraph("Chapter 5: The Compact Smart Contract Language", h1_style))
    story.append(Paragraph(
        "<b>Compact</b> is Midnight's specialized smart contract language designed to write provable Zero-Knowledge programs. Below is the exact architecture of our Payment Vault contract:",
        body_style
    ))

    add_code("""pragma language_version >= 0.20;
import CompactStandardLibrary;

// Public On-Chain Ledger State (Visible to all)
export ledger balance: Uint<128>;
export ledger totalDeposited: Uint<128>;
export ledger totalWithdrawn: Uint<128>;
export ledger owner: Bytes<32>;

// Private Witness (Known ONLY by the user's browser, NEVER sent to network)
witness ownerKey(): Bytes<32>;

constructor() {
  balance = 0;
  totalDeposited = 0;
  totalWithdrawn = 0;
  owner = disclose(deriveKey(ownerKey()));
}

// Deposit Circuit: Accepts unshielded tokens into the vault
export circuit deposit(amount: Uint<128>): [] {
  receiveUnshielded(default<Bytes<32>>, disclose(amount));
  totalDeposited = disclose((totalDeposited + amount) as Uint<128>);
  balance = disclose((balance + amount) as Uint<128>);
}

// Withdraw Circuit: Zero-Knowledge authorized payout
export circuit withdraw(amount: Uint<128>, recipient: UserAddress): [] {
  assert(deriveKey(ownerKey()) == owner, "Only owner can withdraw");
  assert(balance >= amount, "Insufficient balance");
  sendUnshielded(
    default<Bytes<32>>,
    disclose(amount),
    right<ContractAddress, UserAddress>(disclose(recipient))
  );
  totalWithdrawn = disclose((totalWithdrawn + amount) as Uint<128>);
  balance = disclose((balance - amount) as Uint<128>);
}

// Cryptographic Domain Separation Key Derivation
pure circuit deriveKey(sk: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([pad(32, "payment:owner:v1"), sk]);
}""")

    story.append(Paragraph("5.1 How the Compact Circuit Works", h2_style))
    story.append(Paragraph("• <b><code>disclose()</code>:</b> Explicitly reveals a value to the public ledger. In Compact, all values are private by default unless wrapped in <code>disclose()</code>.", bullet_style))
    story.append(Paragraph("• <b><code>receiveUnshielded()</code>:</b> A native Midnight standard library primitive that transfers unshielded tNIGHT tokens from the caller's wallet into the smart contract's liquidity account.", bullet_style))
    story.append(Paragraph("• <b><code>sendUnshielded()</code>:</b> Transfers tokens out of the smart contract to the designated recipient address.", bullet_style))
    story.append(Paragraph("• <b><code>assert(deriveKey(ownerKey()) == owner)</code>:</b> The mathematical ZK magic. The user's machine computes a hash of their private secret key and proves in zero-knowledge that the hash equals the public <code>owner</code> commitment stored on-chain. If the proof succeeds, the funds release. If an attacker attempts to call withdraw, they cannot generate a valid proof and the transaction fails immediately.", bullet_style))

    # ================= CHAPTER 6 =================
    story.append(Paragraph("Chapter 6: End-to-End Transaction Flow & DApp Execution", h1_style))
    story.append(Paragraph(
        "Here is the exact step-by-step pipeline executed when a user interacts with our DApp:",
        body_style
    ))

    flow_data = [
        [Paragraph("<b>Step</b>", body_style), Paragraph("<b>Phase Name</b>", body_style), Paragraph("<b>What Happens Behind the Scenes</b>", body_style)],
        [Paragraph("<b>1</b>", body_style), Paragraph("<b>Wallet Connect</b>", body_style), Paragraph("Browser connects to <code>window.midnight['1am']</code>, fetching unshielded address, shielded coin keys, and indexer URLs in parallel.", body_style)],
        [Paragraph("<b>2</b>", body_style), Paragraph("<b>Parameter Setup</b>", body_style), Paragraph("User inputs token amount (e.g. 50 tNIGHT = 50,000,000 Stars). DApp builds the unproven transaction object.", body_style)],
        [Paragraph("<b>3</b>", body_style), Paragraph("<b>ZK Proving</b>", body_style), Paragraph("DApp transmits circuit constraints to local Proof Server (<code>localhost:6300</code>). Proof engine generates mathematical proof in ~2–4 seconds.", body_style)],
        [Paragraph("<b>4</b>", body_style), Paragraph("<b>Fee Balancing</b>", body_style), Paragraph("1AM wallet calls <code>balanceUnsealedTransaction</code>. ProofStation server sponsors the dust fee and wraps the transaction.", body_style)],
        [Paragraph("<b>5</b>", body_style), Paragraph("<b>Broadcast</b>", body_style), Paragraph("Transaction is submitted to the Midnight network node via RPC. Block validators verify the proof and include it in a block.", body_style)],
        [Paragraph("<b>6</b>", body_style), Paragraph("<b>Indexer Settlement</b>", body_style), Paragraph("Midnight Indexer indexes the block. DApp's patched GraphQL client polls the latest state and updates the React dashboard.", body_style)]
    ]
    flow_table = Table(flow_data, colWidths=[36, 120, 348])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (-1,-1), C_BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 12))

    # ================= CHAPTER 7 =================
    story.append(Paragraph("Chapter 7: Summary & Real-World Horizons", h1_style))
    story.append(Paragraph(
        "By completing this project, you have constructed a full-stack Web3 application operating at the leading edge of blockchain cryptography. You have mastered:",
        body_style
    ))
    story.append(Paragraph("• <b>Writing Zero-Knowledge circuits in Compact.</b>", bullet_style))
    story.append(Paragraph("• <b>Operating on-device ZK proof generation engines.</b>", bullet_style))
    story.append(Paragraph("• <b>Integrating dust-free 1AM wallet sponsorship.</b>", bullet_style))
    story.append(Paragraph("• <b>Querying real-time on-chain states via GraphQL indexers.</b>", bullet_style))
    story.append(Paragraph("• <b>Building institutional-grade user interfaces that eliminate AI slop and adhere to professional craft floor design standards.</b>", bullet_style))

    add_callout("<b>What Can You Build Next?</b> The exact architecture you built today serves as the foundation for Private Voting, Sealed-Bid Auctions, Decentralized Dark Pools, Private Payroll, and Credit Attestations.", bg_color=colors.HexColor("#f0fdf4"), border_color=colors.HexColor("#86efac"))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF generated: {filename}")

if __name__ == "__main__":
    out = "Midnight_Blockchain_and_DApp_Guidebook.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    build_pdf(out)

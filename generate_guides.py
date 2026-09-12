import os
from fpdf import FPDF

class PDFGuide(FPDF):
    def __init__(self, title, subtitle):
        super().__init__()
        self.doc_title = title
        self.doc_subtitle = subtitle
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        # Dark header background accent line
        self.set_fill_color(220, 38, 38) # Red accent
        self.rect(0, 0, 210, 5, 'F')
        
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 30, 30)
        self.cell(0, 10, "CHITRACHAYA PHOTOGRAPHY CLUB", ln=True, align="L")
        
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, f"Official Guide: {self.doc_title}", ln=True, align="L")
        self.line(10, 25, 200, 25)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()} | IIIT Kottayam - Chitrachaya Management System", align="C")

    def section_title(self, label):
        self.ln(4)
        self.set_fill_color(245, 245, 245)
        self.set_text_color(185, 28, 28)
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 8, f"  {label}", ln=True, fill=True)
        self.ln(2)

    def body_paragraph(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def bullet_item(self, title, desc):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(20, 20, 20)
        self.cell(5, 5, chr(149), ln=False)
        self.cell(45, 5, f"{title}: ", ln=False)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, desc)
        self.ln(1)

def build_requester_guide():
    pdf = PDFGuide("Event Requester User Guide", "How to request & track coverage")
    pdf.add_page()

    # Title Banner
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(220, 38, 38)
    pdf.cell(0, 10, "Event Requester User Guide", ln=True, align="C")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "A step-by-step guide for campus clubs, students & event organizers", ln=True, align="C")
    pdf.ln(5)

    pdf.section_title("1. Login & Access Control")
    pdf.body_paragraph("Access to the Chitrachaya Event Management System is strictly restricted to official IIIT Kottayam accounts.")
    pdf.bullet_item("Google Authentication", "Always sign in using the 'Continue with Google' button.")
    pdf.bullet_item("Official Email Requirement", "You MUST use your official @iiitkottayam.ac.in Google email address. Non-college emails will be denied access.")

    pdf.section_title("2. When to Request Event Coverage")
    pdf.body_paragraph("To ensure our photography team can assign dedicated photographers and editors, please adhere to the following timelines:")
    pdf.bullet_item("Major Events & Fests", "Submit your request at least 3 to 5 days before the event date.")
    pdf.bullet_item("Club Workshops & Talks", "Submit your request at least 24 to 48 hours prior to start time.")
    pdf.bullet_item("Urgent / Last-Minute Requests", "Requests submitted less than 1 hour before an event will trigger an high-priority urgent alert to all club members, but coverage availability depends on member schedules.")

    pdf.section_title("3. How to Submit an Event Request")
    pdf.body_paragraph("From your Requester Dashboard, click 'Request Event Coverage' and fill out the required details:")
    pdf.bullet_item("Event Name & Club", "Specify the clear title of the event and host organization.")
    pdf.bullet_item("Date & Time", "Provide accurate start and end times to allow photographers to plan shift coverage.")
    pdf.bullet_item("Venue", "Specify campus venue (e.g., Main Auditorium, Lab 2, Ground, etc.).")
    pdf.bullet_item("Coverage Type", "Select required media type: Photography, Videography, Aftermovie, or Full Coverage.")

    pdf.section_title("4. Understanding the Event Status Pipeline")
    pdf.body_paragraph("Track your request status in real-time from your dashboard through 5 linear stages:")
    pdf.bullet_item("Requested", "Your request is submitted and visible in the club's open event pool.")
    pdf.bullet_item("Assigned", "Club members have ticked/claimed photographer and editor duties for your event.")
    pdf.bullet_item("In Progress", "Event coverage is actively taking place or media is currently being edited.")
    pdf.bullet_item("Uploaded", "Photos/videos have been edited and uploaded to Google Drive.")
    pdf.bullet_item("Delivered", "Google Drive link is attached to your event card for instant download.")

    pdf.section_title("5. Requesting Club Membership Access")
    pdf.body_paragraph("If you are a student interested in joining Chitrachaya as a photographer or editor, click 'Request Club Access' on your dashboard. SubLeads and Leads will review your request and assign you Core/SubLead member privileges.")

    file_path = "Chitrachaya_User_Guide_Event_Requesters.pdf"
    pdf.output(file_path)
    print(f"Generated: {file_path}")

def build_club_members_guide():
    pdf = PDFGuide("Club Members Operations Manual", "Handling Open Tickets, Requests & Logistics")
    pdf.add_page()

    # Title Banner
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(220, 38, 38)
    pdf.cell(0, 10, "Club Members Operations Manual", ln=True, align="C")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "Standard operating procedure for Core (1st Yr), SubLeads (2nd Yr) & Leads (3rd Yr)", ln=True, align="C")
    pdf.ln(5)

    pdf.section_title("1. Event Pool & Task Bidding ('Tick to Claim')")
    pdf.body_paragraph("All incoming event coverage requests appear in the 'Event Pool' on your Club Dashboard.")
    pdf.bullet_item("Self-Assignment", "Any active club member can click 'Tick to Claim (Photographer)' or 'Tick to Claim (Uploader)' to take responsibility for an unassigned event.")
    pdf.bullet_item("Public Assignee Names", "Once claimed, your name is prominently displayed on the event ticket so all team members know who is handling photo and upload duties.")

    pdf.section_title("2. Urgent Event Alert System")
    pdf.body_paragraph("Events scheduled to start in less than 1 hour with unassigned photographer/uploader slots are highlighted with a glowing red 'URGENT' badge. Club members available on campus are encouraged to immediately claim these tickets.")

    pdf.section_title("3. Peer-to-Peer Coverage & Replacement Requests")
    pdf.body_paragraph("Chitrachaya features a flexible task transfer workflow:")
    pdf.bullet_item("Direct Coverage Requests", "Leads and SubLeads can click 'Request Coverage' on an event to ask a specific team member to take an open role.")
    pdf.bullet_item("Task Replacement / Handoff", "If you are assigned to an event but encounter an emergency, click 'Replace' next to your name to send a replacement request to another member.")
    pdf.bullet_item("Confirmation Rules", "Task handoffs ONLY take effect when the targeted member accepts the request in their 'Coverage Requests' panel. If declined, original assignment remains intact.")

    pdf.section_title("4. Progress Tracking & Media Delivery")
    pdf.body_paragraph("Assigned members must keep the event pipeline updated:")
    pdf.bullet_item("Update Progress", "Click 'Update Progress' on your assigned tasks to advance the stage (Assigned -> In Progress -> Uploaded -> Delivered).")
    pdf.bullet_item("Attaching Drive Link", "When photos are ready, paste the public Google Drive folder link in the Update modal to complete delivery and notify the requester.")

    pdf.section_title("5. Team Directory & Role Management")
    pdf.body_paragraph("Access the 'Team Directory' from the top navigation bar to view all active members and manage roles:")
    pdf.bullet_item("Leads (3rd Year)", "Can directly change any member's role to Lead, SubLead, Core, or Event Requester using the role dropdown in the directory.")
    pdf.bullet_item("SubLeads (2nd Year)", "Can directly promote new applicants from 'Event Requester' to 'Core (1st Year)'.")

    file_path = "Chitrachaya_Club_Members_Operations_Guide.pdf"
    pdf.output(file_path)
    print(f"Generated: {file_path}")

if __name__ == "__main__":
    build_requester_guide()
    build_club_members_guide()

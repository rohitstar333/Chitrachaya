import os
from fpdf import FPDF

class StyledPDF(FPDF):
    def __init__(self, title_text, role_text):
        super().__init__()
        self.title_text = title_text
        self.role_text = role_text
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        # Dark Header Bar
        self.set_fill_color(15, 15, 15) # #0f0f0f
        self.rect(0, 0, 210, 28, 'F')
        
        # Red Accent Bar
        self.set_fill_color(220, 38, 38) # #dc2626
        self.rect(0, 28, 210, 2, 'F')

        self.set_xy(12, 6)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, "CHITRACHAYA PHOTOGRAPHY CLUB", ln=True)

        self.set_xy(12, 14)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(220, 38, 38)
        self.cell(0, 6, self.title_text.upper(), ln=True)

        self.set_xy(140, 10)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(180, 180, 180)
        self.cell(60, 6, f"Target Audience: {self.role_text}", align="R")

        self.ln(16)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"IIIT Kottayam Official Photography Platform  |  Page {self.page_no()}", align="C")

    def section_title(self, text):
        self.ln(4)
        self.set_fill_color(240, 240, 240)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(220, 38, 38)
        self.cell(0, 8, f"  {text}", ln=True, fill=True)
        self.ln(3)

    def sub_title(self, text):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        self.cell(0, 6, text, ln=True)
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def bullet_point(self, title, desc):
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(220, 38, 38)
        self.cell(6, 5, ">", ln=False)
        self.set_text_color(30, 30, 30)
        self.cell(45, 5, title, ln=False)
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, desc)
        self.ln(1)

    def callout_box(self, title, text, bg_r=254, bg_g=242, bg_b=242, border_r=220, border_g=38, border_b=38):
        self.set_fill_color(bg_r, bg_g, bg_b)
        self.set_draw_color(border_r, border_g, border_b)
        self.set_line_width(0.5)
        
        y_start = self.get_y()
        self.rect(12, y_start, 186, 22, 'DF')
        self.set_xy(16, y_start + 3)
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(border_r, border_g, border_b)
        self.cell(0, 5, title, ln=True)
        self.set_x(16)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(50, 50, 50)
        self.multi_cell(178, 4.5, text)
        self.set_y(y_start + 25)

def add_quickstart_section(pdf):
    pdf.section_title("1. APP QUICK START & INSTALLATION INSTRUCTIONS")
    pdf.body_text("Follow these 3 essential setup steps to use Chitrachaya on mobile and desktop devices:")
    
    pdf.bullet_point("Step 1: Open Official URL", "Visit http://localhost:5173 (or official college portal) on Chrome, Safari, or Edge. Log in exclusively using your official @iiitkottayam.ac.in Google email.")
    pdf.bullet_point("Step 2: Add to Home Screen (PWA)", "On Android/Desktop Chrome: Tap the 3-dot menu and select 'Install App' or 'Add to Home Screen'. On iOS Safari: Tap the Share button and select 'Add to Home Screen'. This installs Chitrachaya as a standalone mobile application.")
    pdf.bullet_point("Step 3: Allow Push Notifications", "When prompted upon first login, tap 'Allow Notifications'. This enables instant real-time alerts for event approvals, photographer assignments, coverage replacement requests, and IT camera status updates.")

# -------------------------------------------------------------
# PDF 1: EVENT REQUESTERS GUIDE
# -------------------------------------------------------------
def build_requester_guide():
    pdf = StyledPDF("Event Requesters Operations Manual", "Clubs & Event Requesters")
    pdf.add_page()

    add_quickstart_section(pdf)

    pdf.section_title("2. HOW TO REQUEST EVENT COVERAGE")
    pdf.body_text("Event Requesters (Club Heads, Faculty Coordinators, Student Organizers) can submit photography and videography coverage requests easily:")
    pdf.bullet_point("Click Request Event", "On your Requester Dashboard, click the prominent red 'Request Event Coverage' button.")
    pdf.bullet_point("Fill Event Details", "Provide Event Title, Hosting Club Name, Date, Start Time, End Time, Venue, and Required Coverage Type (Photography, Videography, or Both).")
    pdf.bullet_point("Submit Request", "Click Submit. Your request will automatically enter the Chitrachaya Event Pool for Lead review.")

    pdf.section_title("3. TRACKING EVENT PIPELINE & STATUSES")
    pdf.body_text("Track your event's progress in real-time through the 5-stage pipeline indicator:")
    pdf.bullet_point("Requested", "Event submitted and pending Lead review.")
    pdf.bullet_point("Assigned", "Photographer or uploader claimed coverage responsibility.")
    pdf.bullet_point("In Progress", "Event coverage is actively taking place or media editing is underway.")
    pdf.bullet_point("Uploaded", "Photos/videos have been processed and uploaded to Google Drive.")
    pdf.bullet_point("Delivered", "Google Drive link is attached to the card for instant access and download.")

    pdf.section_title("4. ACCESSING DELIVERED MEDIA")
    pdf.callout_box("GOOGLE DRIVE MEDIA ACCESS", "Once event status reaches 'Delivered', an 'Access Photos ->' button will appear on your event card. Click it to view and download all high-resolution event media directly.")

    pdf.output("Chitrachaya_Event_Requesters_Guide.pdf")
    print("Created Chitrachaya_Event_Requesters_Guide.pdf")

# -------------------------------------------------------------
# PDF 2: CLUB MEMBERS & LEADS GUIDE
# -------------------------------------------------------------
def build_member_guide():
    pdf = StyledPDF("Club Members & Leads Operations Manual", "Photographers, Core, SubLeads, Leads")
    pdf.add_page()

    add_quickstart_section(pdf)

    pdf.section_title("2. CLAIMING TICKETS & COVERAGE MANAGEMENT")
    pdf.bullet_point("Event Pool", "View all open tickets in the Event Pool. Click 'Tick to Claim (Photographer)' or 'Tick to Claim (Uploader)' to claim event coverage.")
    pdf.bullet_point("Updating Progress", "On assigned events, click 'Update Progress' to update pipeline status from 'In Progress' to 'Uploaded' and attach Google Drive media links.")
    pdf.bullet_point("Task Replacement", "If unavailable for an assigned event, click 'Replace' next to your badge. Select a club member to send a replacement request. Task transfers only take effect upon target member acceptance.")

    pdf.section_title("3. DIGITAL ID & IT CAMERA HANDOFF REQUESTS")
    pdf.bullet_point("Request Camera (IT)", "Restricted to Leads and SubLeads. Click 'Request Camera (IT)' at the top of the dashboard or on active event cards.")
    pdf.bullet_point("Digital ID Generation", "The modal automatically generates your official Chitrachaya Digital ID Pass containing your Name, @iiitkottayam.ac.in email, Roll ID, and Role Badge.")
    pdf.bullet_point("Contact Numbers", "Enter your Primary Phone Number and Fallback Lead Phone Number, then submit to IT Server Room.")

    pdf.section_title("4. TEAM DIRECTORY & ROLE MANAGEMENT")
    pdf.callout_box("TEAM DIRECTORY & ELEVATION", "Leads can open the 'Team Directory' from the header to view all members, search by name or roll number, and promote members to SubLead, Core, or IT Server Room Staff roles.")

    pdf.output("Chitrachaya_Club_Members_Guide.pdf")
    print("Created Chitrachaya_Club_Members_Guide.pdf")

# -------------------------------------------------------------
# PDF 3: IT SERVER ROOM OPERATIONS GUIDE
# -------------------------------------------------------------
def build_it_guide():
    pdf = StyledPDF("IT Server Room Operations Guide", "IT Staff & Equipment Control")
    pdf.add_page()

    add_quickstart_section(pdf)

    pdf.section_title("2. IT DASHBOARD & CAMERA HANDOFF CONTROL")
    pdf.body_text("IT Server Room Staff access the dedicated IT Dashboard (/it) to process camera handoffs securely:")
    pdf.bullet_point("Pending Requests Tab", "Review pending camera requests. Inspect the member's official Digital ID Pass (Name, Email, Roll ID, Role).")
    pdf.bullet_point("Contact Verification", "Verify the assignee's primary phone number and fallback Lead phone number.")
    pdf.bullet_point("Approve Handoff", "Click 'Approve Handoff' to hand over the camera equipment. The system logs your staff ID as the approver.")

    pdf.section_title("3. TRACKING ACTIVE CAMERAS OUT & RETURNS")
    pdf.bullet_point("Active Handoffs Tab", "View real-time list of issued cameras and who currently holds the equipment along with clickable phone numbers.")
    pdf.bullet_point("Mark Camera Returned", "When the member returns the camera equipment to the IT Server Room, click 'Mark Camera Returned to IT'.")
    pdf.bullet_point("Audit Trail", "All completed returns and rejected requests are logged under the 'History' tab for record keeping.")

    pdf.callout_box("EQUIPMENT SAFETY PROTOCOL", "Always verify Digital ID and contact phone numbers before handing over camera equipment. In case of emergency or delay, contact the fallback Lead phone number immediately.", bg_r=255, bg_g=251, bg_b=235, border_r=217, border_g=119, border_b=6)

    pdf.output("Chitrachaya_IT_Server_Room_Guide.pdf")
    print("Created Chitrachaya_IT_Server_Room_Guide.pdf")

if __name__ == "__main__":
    build_requester_guide()
    build_member_guide()
    build_it_guide()

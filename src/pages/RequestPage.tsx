import EventRequestForm from "@/components/EventRequestForm";

const RequestPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Submit Coverage Request</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill out the form below to request photography coverage for your event.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <EventRequestForm />
      </div>
    </div>
  );
};

export default RequestPage;

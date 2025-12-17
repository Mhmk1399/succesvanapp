"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  FiCalendar,
  FiClock,
  FiMic,
  FiMapPin, 
  FiTruck,
  FiUser,
  FiMessageSquare,
} from "react-icons/fi";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import { Office, Category } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
import { generateTimeSlots } from "@/utils/timeSlots";
import TimeSelect from "@/components/ui/TimeSelect";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import VoiceConfirmationModal from "@/components/global/VoiceConfirmationModal";
import ConversationalModal from "@/components/global/ConversationalModal";
import FastAgentModal from "@/components/global/FastAgentModal";
import { FiCpu } from "react-icons/fi";
import { datePickerStyles } from "./DatePickerStyles";

interface ReservationFormProps {
  isModal?: boolean;
  isInline?: boolean;
  onClose?: () => void;
  onBookNow?: () => void;
}

export default function ReservationForm({
  isModal = false,
  isInline = false,
  onClose,
  onBookNow,
}: ReservationFormProps) {
  const router = useRouter();
  const [showDateRange, setShowDateRange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [reservedSlots, setReservedSlots] = useState<
    { startDate: string; endDate: string; startTime: string; endTime: string; isSameDay: boolean }[]
  >([]);

  // Voice modal state
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceData, setVoiceData] = useState<any>(null);

  // Conversational modal state
  const [showConversationalModal, setShowConversationalModal] = useState(false);

  // Fast AI Agent modal state (quick 1-minute booking)
  const [showFastAgentModal, setShowFastAgentModal] = useState(false);

  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);

  const [formData, setFormData] = useState({
    office: "",
    type: "",
    pickupTime: "10:00",
    returnTime: "10:00",
    driverAge: "",
    message: "",
    name: "",
    email: "",
    phoneNumber: "",
  });

  const pickupTimeSlots = useMemo(() => {
    if (!formData.office || !dateRange[0].startDate) return [];
    const office = offices.find((o) => o._id === formData.office);
    if (!office) return [];

    const date = dateRange[0].startDate;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = office.specialDays?.find(
      (sd: any) => sd.month === month && sd.day === day
    );
    let start = "00:00",
      end = "23:59";

    if (specialDay && specialDay.isOpen) {
      start = specialDay.startTime;
      end = specialDay.endTime;
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen
      );
      if (workingDay) {
        start = workingDay.startTime;
        end = workingDay.endTime;
        
        if (workingDay.pickupExtension) {
          const [startHour, startMin] = start.split(':').map(Number);
          const [endHour, endMin] = end.split(':').map(Number);
          const extendedStartMinutes = Math.max(0, startHour * 60 + startMin - workingDay.pickupExtension.hoursBefore * 60);
          const extendedEndMinutes = Math.min(1439, endHour * 60 + endMin + workingDay.pickupExtension.hoursAfter * 60);
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(2, '0')}:${String(extendedStartMinutes % 60).padStart(2, '0')}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(2, '0')}:${String(extendedEndMinutes % 60).padStart(2, '0')}`;
        }
      }
    }

    return generateTimeSlots(start, end, 15);
  }, [formData.office, dateRange, offices]);

  const returnTimeSlots = useMemo(() => {
    if (!formData.office || !dateRange[0].endDate)
      return [];
    const office = offices.find((o) => o._id === formData.office);
    if (!office) return [];

    const date = dateRange[0].endDate;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = office.specialDays?.find(
      (sd: any) => sd.month === month && sd.day === day
    );
    let start = "00:00", end = "23:59";

    if (specialDay && specialDay.isOpen) {
      start = specialDay.startTime;
      end = specialDay.endTime;
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen
      );
      if (workingDay) {
        start = workingDay.startTime;
        end = workingDay.endTime;
        
        if (workingDay.returnExtension) {
          const [startHour, startMin] = start.split(':').map(Number);
          const [endHour, endMin] = end.split(':').map(Number);
          const extendedStartMinutes = Math.max(0, startHour * 60 + startMin - workingDay.returnExtension.hoursBefore * 60);
          const extendedEndMinutes = Math.min(1439, endHour * 60 + endMin + workingDay.returnExtension.hoursAfter * 60);
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(2, '0')}:${String(extendedStartMinutes % 60).padStart(2, '0')}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(2, '0')}:${String(extendedEndMinutes % 60).padStart(2, '0')}`;
        }
      }
    }

    return generateTimeSlots(start, end, 15);
  }, [formData.office, dateRange, offices]);

  // Initialize voice recording hook
  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (result) => {
      console.log("📥 [Form] Voice result received:", result);

      // Store the voice data and show modal for confirmation
      setVoiceData(result);
      setShowVoiceModal(true);

      console.log("👁️ [Form] Opening confirmation modal");
    },
    onError: (error) => {
      console.error("❌ [Form] Voice recording error:", error);
      showToast.error("Voice recording failed");
    },
    autoSubmit: false, // Set to true if you want automatic submission
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setIsAuthenticated(true);
        setUserData(parsedUser);
        setFormData((prev) => ({
          ...prev,
          name: parsedUser.name || "",
          email: parsedUser.emaildata?.emailAddress || "",
          phoneNumber: parsedUser.phoneData?.phoneNumber || "",
        }));
      } catch (error) {
        console.log("Failed to parse user data");
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offRes, typeRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/types"),
        ]);
        const offData = await offRes.json();
        const typeData = await typeRes.json();
        setOffices(offData.data || []);
        setTypes(typeData.data || []);
      } catch (error) {
        console.log("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch and filter categories based on office and type
  useEffect(() => {
    if (formData.office && formData.type) {
      fetch(`/api/offices/${formData.office}`)
        .then((res) => res.json())
        .then((data) => {
          const office = data.data;
          if (office?.categories && office.categories.length > 0) {
            const filtered = office.categories.filter((cat: any) => {
              const catTypeId = typeof cat.type === 'string' ? cat.type : cat.type?._id;
              return catTypeId === formData.type;
            });
            setCategories(filtered);
          } else {
            setCategories([]);
          }
        })
        .catch((err) => console.error(err));
    } else {
      setCategories([]);
    }
  }, [formData.office, formData.type]);

  useEffect(() => {
    if (formData.office && dateRange[0].startDate && dateRange[0].endDate) {
      const startDate = dateRange[0].startDate.toISOString().split("T")[0];
      const endDate = dateRange[0].endDate.toISOString().split("T")[0];
      
      const fetchPromises = [startDate];
      if (startDate !== endDate) {
        fetchPromises.push(endDate);
      }
      
      Promise.all(
        fetchPromises.map(date => 
          fetch(`/api/reservations/by-office?office=${formData.office}&startDate=${date}`)
            .then(res => res.json())
        )
      )
        .then(results => {
          const allSlots = results.flatMap(data => data.data?.reservedSlots || []);
          setReservedSlots(allSlots);
        })
        .catch((err) => console.error(err));
    }
  }, [formData.office, dateRange]);



  const handleGlobalVoice = () => {
    console.log("🎤 [Form] Voice button clicked");
    toggleRecording();
  };

  const handleConversationalMode = () => {
    console.log("💬 [Form] Starting conversational mode");
    setShowConversationalModal(true);
  };

  const handleAIAgentMode = () => {
    console.log("🤖 [Form] Starting Fast AI Agent mode");
    setShowFastAgentModal(true);
  };

  const handleFastAgentComplete = (reservationId: string, userToken: string, isNewUser: boolean) => {
    console.log(
      "✅ [Form] Fast Agent completed booking:",
      reservationId,
      "isNewUser:", isNewUser
    );
    setShowFastAgentModal(false);

    // Store the token if provided
    if (userToken) {
      localStorage.setItem("token", userToken);
    }

    showToast.success("Booking created successfully!");
    
    // Close any parent modal before navigation
    if (onClose) {
      onClose();
    }
    
    // Navigate based on whether it's a new user
    if (isNewUser) {
      router.push(`/customerDashboard?uploadLicense=true`);
    } else {
      router.push(`/customerDashboard`);  
    }
  };

  const handleConversationComplete = (data: any) => {
    console.log("✅ [Form] Conversation completed with data:", data);
    setShowConversationalModal(false);

    // Update form with conversation data
    setFormData((prev) => ({
      ...prev,
      office: data.office || prev.office,
      type: data.type || prev.type,
      pickupTime: data.pickupTime || prev.pickupTime,
      returnTime: data.returnTime || prev.returnTime,
      driverAge: data.driverAge || prev.driverAge,
      message: data.message || prev.message,
    }));

    // Update date range if provided
    if (data.pickupDate && data.returnDate) {
      setDateRange([
        {
          startDate: new Date(data.pickupDate),
          endDate: new Date(data.returnDate),
          key: "selection",
        },
      ]);
    }

    showToast.success("Reservation details filled via conversation!");
  };

  const handleVoiceConfirm = (data: any) => {
    console.log("✅ [Form] User confirmed voice data:", data);

    // Update form with confirmed data
    setFormData((prev) => ({
      ...prev,
      office: data.office || prev.office,
      type: data.type || prev.type,
      pickupTime: data.pickupTime || prev.pickupTime,
      returnTime: data.returnTime || prev.returnTime,
      driverAge: data.driverAge || prev.driverAge,
      message: data.message || prev.message,
    }));

    // Update date range if provided
    if (data.pickupDate && data.returnDate) {
      console.log("📅 [Form] Updating date range:", {
        pickup: data.pickupDate,
        return: data.returnDate,
      });

      setDateRange([
        {
          startDate: new Date(data.pickupDate),
          endDate: new Date(data.returnDate),
          key: "selection",
        },
      ]);
    }

    console.log("✅ [Form] Form updated with voice data");
    showToast.success("Form filled successfully!");
  };

  const handleAutoSubmit = async (data: any) => {
    try {
      // Store rental details in sessionStorage
      const pickupDateTime = new Date(data.pickupDate);
      const returnDateTime = new Date(data.returnDate);

      const rentalDetails = {
        office: data.office,
        type: data.type,
        pickupDate: pickupDateTime.toISOString(),
        returnDate: returnDateTime.toISOString(),
        pickupTime: data.pickupTime,
        returnTime: data.returnTime,
        pickupLocation: offices.find((o) => o._id === data.office)?.name || "",
        driverAge: data.driverAge,
        message: data.message,
      };
      sessionStorage.setItem("rentalDetails", JSON.stringify(rentalDetails));

      // Navigate to reservation page
      const url = `/reservation?type=${data.type}&office=${data.office}&age=${data.driverAge}`;
      router.push(url);
    } catch (error) {
      showToast.error("Failed to process reservation");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeChange = (name: string, time: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: time,
    }));
  };

  const getSelectedOffice = () => {
    return offices.find((o) => o._id === formData.office);
  };

  const isDateDisabled = (date: Date) => {
    const office = getSelectedOffice();
    if (!office) return false;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    // Check special days first
    const specialDay = office.specialDays?.find(
      (sd) => sd.month === month && sd.day === day
    );
    if (specialDay && !specialDay.isOpen) return true;

    // Check working hours
    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && !workingDay.isOpen) return true;

    return false;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const office = getSelectedOffice();
    if (!office) return { start: "00:00", end: "23:59", info: "" };

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    // Check special days first
    const specialDay = office.specialDays?.find(
      (sd) => sd.month === month && sd.day === day
    );
    if (specialDay && specialDay.isOpen) {
      return {
        start: specialDay.startTime,
        end: specialDay.endTime,
        info: `Special day: ${specialDay.reason} (${specialDay.startTime} - ${specialDay.endTime})`,
      };
    }

    // Use working hours
    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && workingDay.isOpen) {
      let info = `${workingDay.day}: ${workingDay.startTime} - ${workingDay.endTime}`;
      
      const hasPickupExt = workingDay.pickupExtension && (workingDay.pickupExtension.hoursBefore > 0 || workingDay.pickupExtension.hoursAfter > 0);
      const hasReturnExt = workingDay.returnExtension && (workingDay.returnExtension.hoursBefore > 0 || workingDay.returnExtension.hoursAfter > 0);
      
      if (hasPickupExt || hasReturnExt) {
        info += ' ';
        if (hasPickupExt) {
          info += `🟡 Pickup ext: ${workingDay.pickupExtension.hoursBefore}h before, ${workingDay.pickupExtension.hoursAfter}h after (+£${workingDay.pickupExtension.flatPrice}) `;
        }
        if (hasReturnExt) {
          info += `🟡 Return ext: ${workingDay.returnExtension.hoursBefore}h before, ${workingDay.returnExtension.hoursAfter}h after (+£${workingDay.returnExtension.flatPrice})`;
        }
      }
      
      return {
        start: workingDay.startTime,
        end: workingDay.endTime,
        info,
      };
    }

    return { start: "00:00", end: "23:59", info: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store rental details in sessionStorage with time included
      const pickupDateTime = new Date(dateRange[0].startDate || new Date());
      const [pickupHour, pickupMinute] = formData.pickupTime.split(":");
      pickupDateTime.setHours(
        parseInt(pickupHour),
        parseInt(pickupMinute),
        0,
        0
      );

      const returnDateTime = new Date(dateRange[0].endDate || new Date());
      const [returnHour, returnMinute] = formData.returnTime.split(":");
      returnDateTime.setHours(
        parseInt(returnHour),
        parseInt(returnMinute),
        0,
        0
      );

      const rentalDetails = {
        office: formData.office,
        type: formData.type,
        pickupDate: pickupDateTime.toISOString(),
        returnDate: returnDateTime.toISOString(),
        pickupTime: formData.pickupTime,
        returnTime: formData.returnTime,
        pickupLocation:
          offices.find((o) => o._id === formData.office)?.name || "",
        driverAge: formData.driverAge,
        message: formData.message,
      };
      sessionStorage.setItem("rentalDetails", JSON.stringify(rentalDetails));

      // Open modal instead of redirecting
      if (onBookNow) {
        onBookNow();
        if (onClose) onClose();
      } else {
        const url = `/reservation?type=${formData.type}&office=${formData.office}&age=${formData.driverAge}`;
        router.push(url);
      }
    } catch (error) {
      showToast.error("Reservation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isInline
          ? "space-y-0 bg-white/5 py-8 px-4 rounded-xl backdrop-blur-lg border border-gray-500/50"
          : "space-y-6"
      }
    >
      <div
        className={
          isInline
            ? "grid grid-cols-8 gap-1 mx-auto justify-center items-end"
            : "hidden md:grid grid-cols-2 gap-4"
        }
      >
        {/* Office */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiMapPin className="text-amber-400 text-lg" /> Office
          </label>
          <CustomSelect
            options={offices}
            value={formData.office}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, office: val }))
            }
            placeholder="Select Office"
            isInline={isInline}
          />
        </div>

        {/* Type */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiTruck className="text-amber-400 text-lg relative" /> Type
          </label>
          <CustomSelect
            options={types}
            value={formData.type}
            onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
            placeholder="Select Type"
            isInline={isInline}
          />
        </div>

        {/* Date Range */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiCalendar className="text-amber-400 text-lg" /> Dates
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateRange(!showDateRange)}
              className={`w-full bg-white/10 border border-white/20 rounded-lg text-white text-left focus:outline-none focus:border-amber-400 transition-colors ${
                isInline ? "px-2 py-2 text-xs" : "px-4 py-3 text-sm"
              }`}
            >
              {isInline ? (
                <>
                  {format(dateRange[0].startDate || new Date(), "dd/MM")} -{" "}
                  {format(dateRange[0].endDate || new Date(), "dd/MM")}
                </>
              ) : (
                <>
                  {format(dateRange[0].startDate || new Date(), "dd/MM/yyyy")} -{" "}
                  {format(dateRange[0].endDate || new Date(), "dd/MM/yyyy")}
                </>
              )}
            </button>
            {showDateRange && (
              <div
                className={`absolute left-0 mt-2 z-50 bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-4 ${
                  isInline ? "-top-72" : "-top-50"
                }`}
              >
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => {
                    const { startDate, endDate } = item.selection;
                    setDateRange([
                      {
                        startDate: startDate || new Date(),
                        endDate: endDate || new Date(),
                        key: "selection",
                      },
                    ]);
                  }}
                  minDate={new Date()}
                  rangeColors={["#fbbf24"]}
                  disabledDates={
                    formData.office
                      ? (Array.from({ length: 365 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i);
                          return isDateDisabled(date) ? date : null;
                        }).filter(Boolean) as Date[])
                      : []
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowDateRange(false)}
                  className="w-full mt-3 px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pickup Time */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiClock className="text-amber-400 text-lg" /> From
          </label>

          {dateRange[0].startDate && (() => {
            const office = getSelectedOffice();
            const date = dateRange[0].startDate;
            const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
            const workingDay = office?.workingTime?.find((w: any) => w.day === dayName && w.isOpen);
            const extensionTimes = workingDay?.pickupExtension ? {
              start: pickupTimeSlots[0],
              end: pickupTimeSlots[pickupTimeSlots.length - 1],
              normalStart: workingDay.startTime,
              normalEnd: workingDay.endTime,
              price: workingDay.pickupExtension.flatPrice
            } : undefined;
            return (
              <TimeSelect
                value={formData.pickupTime}
                onChange={(time) => handleTimeChange("pickupTime", time)}
                slots={pickupTimeSlots}
                reservedSlots={reservedSlots}
                isInline={isInline}
                tooltip={getAvailableTimeSlots(dateRange[0].startDate).info}
                selectedDate={dateRange[0].startDate}
                isStartTime={true}
                extensionTimes={extensionTimes}
              />
            );
          })()}
        </div>

        {/* Return Time */}
        <div className="">
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiClock className="text-amber-400 text-lg" /> To
          </label>
          {dateRange[0].endDate && (() => {
            const office = getSelectedOffice();
            const date = dateRange[0].endDate;
            const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
            const workingDay = office?.workingTime?.find((w: any) => w.day === dayName && w.isOpen);
            const extensionTimes = workingDay?.returnExtension ? {
              start: returnTimeSlots[0],
              end: returnTimeSlots[returnTimeSlots.length - 1],
              normalStart: workingDay.startTime,
              normalEnd: workingDay.endTime,
              price: workingDay.returnExtension.flatPrice
            } : undefined;
            return (
              <TimeSelect
                value={formData.returnTime}
                onChange={(time) => handleTimeChange("returnTime", time)}
                slots={returnTimeSlots}
                reservedSlots={reservedSlots}
                isInline={isInline}
                tooltip={getAvailableTimeSlots(dateRange[0].endDate).info}
                selectedDate={dateRange[0].endDate}
                isStartTime={false}
                extensionTimes={extensionTimes}
              />
            );
          })()}
        </div>

        {/* Driver Age */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiUser className="text-amber-400 text-lg" /> Age
          </label>
          <input
            type="number"
            name="driverAge"
            value={formData.driverAge}
            onChange={handleInputChange}
            required
            className={`w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors ${
              isInline ? "px-2 py-2 text-xs" : "px-4 py-3 text-sm"
            }`}
            placeholder="25-70"
            min="25"
            max="70"
          />
        </div>

        {/* Buttons Row */}
        {isInline ? (
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 px-4 py-1 text-xs"
            >
              {isSubmitting ? "Booking..." : "BOOK"}
            </button>
            <button
              type="button"
              onClick={handleGlobalVoice}
              disabled={isProcessing}
              className={`px-6 py-1 rounded-lg font-semibold flex items-center gap-2 transition-all text-xs disabled:opacity-50 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : isProcessing
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                  : "bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/50"
              }`}
            >
              <FiMic className="text-lg" />
            </button>
          </div>
        ) : (
          <div className="col-span-2 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 px-8 py-3 text-sm"
            >
              {isSubmitting ? "Booking..." : "RESERVE NOW"}
            </button>

            {/* AI Consultant Button - New comprehensive agent */}
            <button
              type="button"
              onClick={handleAIAgentMode}
              className="w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/50"
            >
              <FiCpu className="text-lg" />
              🤖 AI Van Consultant - Tell Me What You Need!
            </button>
          </div>
        )}
      </div>

      {/* Mobile: Flex Col */}
      <div className="md:hidden space-y-3">
        <div>
          <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            <FiMapPin className="text-amber-400" /> Office
          </label>
          <CustomSelect
            options={offices}
            value={formData.office}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, office: val }))
            }
            placeholder="Select Office"
            isInline={true}
          />
        </div>

        <div>
          <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            <FiTruck className="text-amber-400" /> Type
          </label>
          <CustomSelect
            options={types}
            value={formData.type}
            onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
            placeholder="Select Type"
            isInline={true}
          />
        </div>

        <div>
          <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            <FiCalendar className="text-amber-400" /> Select Dates
          </label>
          <button
            type="button"
            onClick={() => setShowDateRange(!showDateRange)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs text-left focus:outline-none focus:border-amber-400 transition-colors"
          >
            {format(dateRange[0].startDate || new Date(), "dd/MM")} -{" "}
            {format(dateRange[0].endDate || new Date(), "dd/MM")}
          </button>
          {showDateRange && (
            <div className="mt-2 bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-2 overflow-x-auto">
              <DateRange
                ranges={dateRange}
                onChange={(item) => {
                  const { startDate, endDate } = item.selection;
                  setDateRange([
                    {
                      startDate: startDate || new Date(),
                      endDate: endDate || new Date(),
                      key: "selection",
                    },
                  ]);
                }}
                minDate={new Date()}
                rangeColors={["#fbbf24"]}
              />
              <button
                type="button"
                onClick={() => setShowDateRange(false)}
                className="w-full mt-2 px-3 py-1.5 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors text-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-white text-xs font-semibold mb-1">
              Pickup Time
            </label>
            {dateRange[0].startDate && (() => {
              const office = getSelectedOffice();
              const date = dateRange[0].startDate;
              const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
              const workingDay = office?.workingTime?.find((w: any) => w.day === dayName && w.isOpen);
              const extensionTimes = workingDay?.pickupExtension ? {
                start: pickupTimeSlots[0],
                end: pickupTimeSlots[pickupTimeSlots.length - 1],
                normalStart: workingDay.startTime,
                normalEnd: workingDay.endTime,
                price: workingDay.pickupExtension.flatPrice
              } : undefined;
              return (
                <TimeSelect
                  value={formData.pickupTime}
                  onChange={(time) => handleTimeChange("pickupTime", time)}
                  slots={pickupTimeSlots}
                  reservedSlots={reservedSlots}
                  isInline={true}
                  tooltip={getAvailableTimeSlots(dateRange[0].startDate).info}
                  selectedDate={dateRange[0].startDate}
                  isStartTime={true}
                  extensionTimes={extensionTimes}
                />
              );
            })()}
            {dateRange[0].startDate && (
              <p className="text-amber-300 text-[10px] mt-0.5">
                {getAvailableTimeSlots(dateRange[0].startDate).info}
              </p>
            )}
          </div>
          <div>
            <label className="block text-white text-xs font-semibold mb-1">
              Return Time
            </label>
            {dateRange[0].endDate && (() => {
              const office = getSelectedOffice();
              const date = dateRange[0].endDate;
              const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
              const workingDay = office?.workingTime?.find((w: any) => w.day === dayName && w.isOpen);
              const extensionTimes = workingDay?.returnExtension ? {
                start: returnTimeSlots[0],
                end: returnTimeSlots[returnTimeSlots.length - 1],
                normalStart: workingDay.startTime,
                normalEnd: workingDay.endTime,
                price: workingDay.returnExtension.flatPrice
              } : undefined;
              return (
                <TimeSelect
                  value={formData.returnTime}
                  onChange={(time) => handleTimeChange("returnTime", time)}
                  slots={returnTimeSlots}
                  reservedSlots={reservedSlots}
                  isInline={true}
                  tooltip={getAvailableTimeSlots(dateRange[0].endDate).info}
                  selectedDate={dateRange[0].endDate}
                  isStartTime={false}
                  extensionTimes={extensionTimes}
                />
              );
            })()}
            {dateRange[0].endDate && (
              <p className="text-amber-300 text-[10px] mt-0.5">
                {getAvailableTimeSlots(dateRange[0].endDate).info}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
              <FiUser className="text-amber-400" /> Age
            </label>
            <input
              type="number"
              name="driverAge"
              value={formData.driverAge}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
              placeholder="18+"
              min="18"
            />
          </div>
          <div>
            <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
              <FiMessageSquare className="text-amber-400" /> Message
            </label>
            <input
              type="text"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
              placeholder="Optional"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 text-sm disabled:opacity-50"
        >
          {isSubmitting ? "Booking..." : "RESERVE NOW"}
        </button>
        
        {/* AI Consultant Button - Mobile */}
        <button
          type="button"
          onClick={handleAIAgentMode}
          className="w-full px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/50"
        >
          <FiCpu className="text-lg" />
          🤖 AI Van Consultant
        </button>
      </div>

      <style jsx global>
        {datePickerStyles}
      </style>

      {/* Voice Confirmation Modal */}
      {voiceData && (
        <VoiceConfirmationModal
          isOpen={showVoiceModal}
          onClose={() => {
            console.log("❌ [Form] Modal closed without confirmation");
            setShowVoiceModal(false);
          }}
          onConfirm={handleVoiceConfirm}
          extractedData={voiceData}
          offices={offices}
          types={types}
        />
      )}

      {/* Conversational Modal */}
      <ConversationalModal
        isOpen={showConversationalModal}
        onClose={() => {
          console.log("❌ [Form] Conversational modal closed");
          setShowConversationalModal(false);
        }}
        onComplete={handleConversationComplete}
        offices={offices}
        types={types}
      />

      {/* Fast AI Agent Modal - Quick 1-minute booking */}
      <FastAgentModal
        isOpen={showFastAgentModal}
        onClose={() => {
          console.log("❌ [Form] Fast Agent modal closed");
          setShowFastAgentModal(false);
        }}
        onComplete={handleFastAgentComplete}
      />
    </form>
  );
}
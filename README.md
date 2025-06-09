# Prism Controller Firmware Update Guide

**WARNING: Flashing firmware carries a risk of bricking your controller. Proceed with extreme caution and only if you are confident in what you are doing. If you are unsure, do not attempt this process.**

This repository contains UF2 firmware files for updating Prism controllers. Follow the steps below carefully to update your controller's firmware.

## Prerequisites
- Ensure you have the correct UF2 firmware file for your specific Prism controller model.
- A Windows computer with administrative access to run Command Prompt (cmd).
- SignalRGB software installed (but not running during the update process).

## Step-by-Step Instructions

1. **Unplug All Prism Controllers Except One**  
   Disconnect all Prism controllers from your computer, then plug in only the one you wish to update.

2. **Quit SignalRGB**  
   Open Task Manager (`Ctrl + Shift + Esc`), locate SignalRGB in the list of processes, and ensure it is not running. If it is, right-click and select "End Task."

3. **Check COM Port in Command Prompt**  
   - Open Command Prompt (`cmd`) as Administrator.
   - Type `mode` and press Enter.
   - Look for a result showing a baud rate of `115200`. Note the associated `COM` port (e.g., `COM6`).

4. **Enter Bootloader Mode**  
   - In Command Prompt, type `mode COM6 baud=1200` (replace `COM6` with the COM port noted in Step 3) and press Enter.
   - This will put the controller into bootloader mode, and a new "drive" (similar to a USB drive) will appear in File Explorer.

5. **Flash the Firmware**  
   - Locate the appropriate UF2 firmware file for your controller in this repository.
   - Drag and drop the UF2 file into the controller's "drive" in File Explorer.
   - The drive will automatically close once the firmware is flashed.

6. **Wait and Verify**  
   - Wait approximately 10 seconds after the drive closes.
   - Open SignalRGB. The updated controller should now appear in the software.

## Troubleshooting
- If the controller does not appear in SignalRGB, ensure the correct firmware file was used and repeat the process.
- If the COM port does not show in `mode`, ensure the controller is properly connected and try a different USB port or cable.
- If you encounter issues, do not attempt to flash multiple times without consulting support, as this may increase the risk of bricking.

**Note**: Always verify you are using the correct firmware file for your specific controller model to avoid potential issues.

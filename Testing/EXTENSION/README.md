# NDE Data Assistant Extension

A modern browser extension for extracting and managing NDE (Nota Dinas Elektronik) data with an intuitive user interface.

## Features

✨ **Modern UI/UX Design**
- Clean, professional interface
- Intuitive navigation and feedback
- Responsive design for all screen sizes
- Accessibility-friendly

🚀 **Smart Data Extraction**
- One-click data extraction from NDE pages
- Automatic field mapping and validation
- Real-time feedback during extraction
- Error handling with helpful guidance

📊 **Data Management**
- Review and edit extracted data
- Organized field grouping
- Auto-save functionality
- Export to MTL system

## Installation

### For Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `Testing/EXTENSION/` folder
4. The extension icon should appear in your toolbar

### For Production
1. Package the extension using Chrome's developer tools
2. Install the generated `.crx` file
3. Enable "Allow access to file URLs" in extension settings

## Usage Guide

### Step 1: Prepare Your Data
1. Open the NDE mockup page (`MOCKUP/nde_mockup.html`)
2. Ensure all required data fields are present on the page
3. Verify the page loads correctly in your browser

### Step 2: Extract Data
1. Click the NDE Data Assistant extension icon in your toolbar
2. The popup will open showing the main interface
3. Click the **"Extract Data"** button
4. Wait for the extraction process to complete
5. Review the extracted data in the form

### Step 3: Review and Edit
1. Check all extracted fields for accuracy
2. Edit any incorrect or missing data
3. Add additional information if needed
4. Verify all required fields are completed

### Step 4: Send to MTL
1. Click the **"Send to MTL"** button
2. The data will be processed and sent to the MTL system
3. A new tab will open with the MTL interface
4. The popup will close automatically

## Interface Overview

### Header Section
- **Extension Icon**: Visual identifier with gradient design
- **Title**: Clear branding and purpose
- **Subtitle**: Brief description of functionality

### Status Section
- **Initial State**: Instructions and guidance for first-time users
- **Loading State**: Animated spinner during data extraction
- **Success State**: Confirmation message with extracted data
- **Error State**: Helpful error messages with solutions

### Data Form
- **Basic Information**: Document number, subject, sender, attachment ID
- **SVP IA Information**: SPK number, dates, findings, recommendations
- **Organized Layout**: Logical grouping with clear section headers
- **Input Validation**: Real-time feedback and error handling

### Action Buttons
- **Extract Data**: Primary action with loading states
- **Send to MTL**: Secondary action (enabled after extraction)
- **Visual Feedback**: Icons and animations for better UX

## Troubleshooting

### Common Issues

#### "Failed to connect to page"
**Solution**: 
- Ensure "Allow access to file URLs" is enabled in extension settings
- Refresh the NDE page and try again
- Check that you're on the correct NDE mockup page

#### "No data found"
**Solution**:
- Verify the NDE page has the correct element IDs
- Check that the page is fully loaded
- Ensure all required data fields are present

#### Extension not working
**Solution**:
- Reload the extension in `chrome://extensions/`
- Clear browser cache and cookies
- Restart the browser if necessary

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Please open the NDE mockup page first" | Wrong page | Navigate to `MOCKUP/nde_mockup.html` |
| "Failed to connect to page" | Extension permissions | Enable file URL access in settings |
| "No data found" | Missing elements | Check page structure and element IDs |
| "Failed to send data" | Network/system error | Try again or check MTL system status |

## Technical Details

### File Structure
```
Testing/EXTENSION/
├── popup.html              # Main popup interface
├── popup.js               # Interactive functionality
├── popup.css              # Styles and animations
├── content.js             # Content script for data extraction
├── manifest.json          # Extension configuration
├── icons/                 # Extension icons
└── README.md             # This file
```

### Browser Support
- **Chrome**: 88+ (Recommended)
- **Firefox**: 85+
- **Edge**: 88+
- **Safari**: 14+

### Performance
- **Load Time**: < 1 second
- **Memory Usage**: < 10MB
- **File Size**: < 20KB total

## Development

### Prerequisites
- Modern web browser
- Basic knowledge of HTML/CSS/JavaScript
- Chrome Developer Tools

### Local Development
1. Clone or download the extension files
2. Make changes to HTML, CSS, or JavaScript files
3. Reload the extension in `chrome://extensions/`
4. Test changes in the browser

### Building for Production
1. Optimize and minify code
2. Update version numbers in `manifest.json`
3. Package using Chrome's developer tools
4. Test thoroughly before distribution

## Contributing

### Code Style
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Maintain accessibility guidelines
- Add comments for complex logic

### Testing
- Test on multiple browsers
- Verify accessibility compliance
- Check responsive design
- Validate error handling

## Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review the error messages and solutions
3. Test with different browsers and pages
4. Contact the development team if issues persist

## Version History

### v1.0 (Current)
- Modern UI/UX redesign
- Improved error handling
- Better accessibility
- Enhanced user feedback
- Responsive design

### Future Versions
- Dark mode support
- Keyboard shortcuts
- Advanced data validation
- Export options
- Performance optimizations

---

**NDE Data Assistant Extension** - Making data extraction simple and efficient. 
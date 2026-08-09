import Foundation
import Vision
import CoreImage

// facebox <image> — in ra JSON: kích thước ảnh + khung mặt lớn nhất (toạ độ pixel, gốc trên-trái)
let args = CommandLine.arguments
guard args.count >= 2, let img = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else { exit(2) }

let W = img.extent.width, H = img.extent.height
let handler = VNImageRequestHandler(ciImage: img, options: [:])
let req = VNDetectFaceRectanglesRequest()
var out = "{\"w\":\(Int(W)),\"h\":\(Int(H)),\"face\":null}"

if (try? handler.perform([req])) != nil,
   let faces = req.results as? [VNFaceObservation], !faces.isEmpty {
    // ảnh có thể lọt người phía sau — lấy khuôn mặt lớn nhất
    let f = faces.max(by: { $0.boundingBox.height < $1.boundingBox.height })!
    let bb = f.boundingBox
    let fw = bb.width * W, fh = bb.height * H
    let fx = bb.minX * W
    let fy = (1 - bb.maxY) * H          // Vision gốc dưới-trái → đổi sang trên-trái
    out = "{\"w\":\(Int(W)),\"h\":\(Int(H)),"
        + "\"face\":{\"x\":\(Int(fx)),\"y\":\(Int(fy)),\"w\":\(Int(fw)),\"h\":\(Int(fh))}}"
}
print(out)
